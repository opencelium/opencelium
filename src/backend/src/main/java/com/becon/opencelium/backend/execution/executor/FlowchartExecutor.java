package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.enums.LogType;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.logger.msg.ConnectorLog;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.logger.msg.MethodData;
import com.becon.opencelium.backend.execution.executor.model.Loop;
import com.becon.opencelium.backend.execution.executor.model.Operation;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.ocel.ProcessorType;
import com.becon.opencelium.backend.resource.execution.FlowchartEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Stack;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.utility.MediaTypeUtility.isBinaryCompatible;
import static com.becon.opencelium.backend.utility.MediaTypeUtility.isJsonCompatible;

public class FlowchartExecutor {
    private final ExpressionProcessor expressionProcessor;
    private final ExecutionManager executionManager;
    private final RestTemplate restTemplate;
    private final List<Object> executables;
    private final OcLogger<ExecutionLog> logger;
    private final MaskingService masking;
    private final Pagination pagination;

    // log related variables:
    private final String flowId;
    private final int connectorId;
    private final String connectorName;
    private final Stack<String> endPhases = new Stack<>();


    public FlowchartExecutor(
            FlowchartEx connectorEx, ExecutionManager executionManager,
            RestTemplate restTemplate, OcLogger<ExecutionLog> logger, MaskingService masking
    ) {
        this.expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);
        this.executionManager = executionManager;
        this.restTemplate = restTemplate;
        this.logger = logger;
        this.masking = masking;

        this.executables = new ArrayList<>();
        if (Objects.nonNull(connectorEx.getMethods())) {
            connectorEx.getMethods().forEach(o -> {
                o.setInvoker(connectorEx.getInvoker().getName());
                executables.add(o);
            });
        }
        if (Objects.nonNull(connectorEx.getOperators())) {
            this.executables.addAll(connectorEx.getOperators());
        }
        this.executables.sort(getComparator());

        this.pagination = connectorEx.getPagination();

        // initialize log related variables:
        this.flowId = connectorEx.getFlowId();
        this.connectorId = connectorEx.getCtorId();
        this.connectorName = connectorEx.getName();
    }

    public void start() {
        logger.getLogEntity().setType(LogType.INFO);
        logger.getLogEntity().setConnector(new ConnectorLog(connectorName, flowId));
        logger.logAndSend(String.format("phase=FLOWCHART_START flowId=%s connectorId=%d connectorName=%s direction=%s", flowId, connectorId, connectorName, flowId));
        endPhases.push(String.format("phase=FLOWCHART_END flowId=%s connectorId=%d connectorName=%s direction=%s", flowId, connectorId, connectorName, flowId));

        try {
            executionManager.setCurrentCtorId(connectorId);

            int headPointer = 0;
            while (headPointer < executables.size()) {
                int tailPointer = getTailPointer(headPointer);

                execute(headPointer, tailPointer);

                headPointer = tailPointer + 1;
            }
        } catch (RuntimeException e) {
            logger.logAndSend(e);
            throw e;
        } finally {
            while(!endPhases.isEmpty()) {
                logger.logAndSend(endPhases.pop());
            }
        }
    }

    private void execute(int headPointer, int tailPointer) {
        if (headPointer > tailPointer) {
            return;
        }

        // points to the end of the operator body
        int tail = getTailPointer(headPointer);
        String index = getIndex(executables.get(headPointer));

        if (executables.get(headPointer) instanceof OperationDTO operation) {
            logger.getLogEntity().setMethodData(new MethodData(operation.getOperationId()));
            logger.logAndSend(String.format("phase=OPERATION_START indexPath=%s name=\"%s\" %s", index, operation.getName(), getLoopData()));
            endPhases.push(String.format("phase=OPERATION_END indexPath=%s name=\"%s\" %s", index, operation.getName(), getLoopData()));

            if (headPointer != tail) {
                throw new RuntimeException("Methods cannot have body");
            }

            executeOperation(operation);

            logger.logAndSend(endPhases.pop());
            logger.getLogEntity().setMethodData(null);
        } else if (executables.get(headPointer) instanceof OperatorEx operator) {
            if (Objects.equals(operator.getType(), "if")) {
                logger.logAndSend(String.format("phase=IF_START indexPath=%s expression=(%s) %s", index, operator.getExpression(), getLoopData()));
                endPhases.push(String.format("phase=IF_END indexPath=%s %s", index, getLoopData()));

                boolean result;
                try {
                    result = (Boolean) expressionProcessor.evaluate(
                            operator.getExpression(),
                            executionManager::getValue,
                            logger,
                            masking
                        );

                    logger.logAndSend("segment=IF_RESULT data=" + result);
                } catch (RuntimeException e) {
                    logger.logAndSend("segment=IF_RESULT data=unknown");
                    throw e;
                }

                if (result) {
                    // if result is true, then execute if operators' body
                    execute(headPointer + 1, tail);
                }
                logger.logAndSend(endPhases.pop());
            } else {
                Loop loop = Loop.fromEx(operator);
                Object referencedList = executionManager.getValue(loop.getRef());
                List<String> list = new ArrayList<>();

                if (ObjectUtils.isEmpty(referencedList)) {
                    // if list empty just do nothing
                } else if (loop.getOperator() == RelationalOperator.FOR) {
                    int length = ((List<Object>) referencedList).size();

                    for (int i = 0; i < length; i++) {
                        list.add(String.valueOf(i));
                    }

                } else if (loop.getOperator() == RelationalOperator.FOR_IN) {
                    list = (List<String>) referencedList;
                } else {
                    String[] strs = ((String) referencedList).split(loop.getDelimiter());

                    Collections.addAll(list, strs);
                }

                int length = list.size();

                logger.logAndSend(String.format("phase=LOOP_START indexPath=%s expression=(%s) size=%d iterator=\"%s\" %s", index, loop.getRef(), length, loop.getIterator(), getLoopData()));
                logger.logAndSend(String.format("segment=LOOP_REF ref=(%s) data=%s", loop.getRef(), list.stream().collect(Collectors.joining(", ", "[", "]"))));
                endPhases.push(String.format("phase=LOOP_END indexPath=%s %s", index, getLoopData()));

                executionManager.getLoops().add(loop);
                for (int i = 0; i < length; i++) {
                    // update currently executing loops' data
                    loop.setIndex(i);
                    loop.setValue(list.get(i));

                    // if length !=0, then execute loop operators' body
                    execute(headPointer + 1, tail);
                }

                // remove executed loops' data
                executionManager.getLoops().remove(loop);
                logger.logAndSend(endPhases.pop());
            }
        } else {
            throw new IllegalArgumentException("Unsupported type: " + executables.get(headPointer).getClass());
        }

        // we already executed operations'/operators' body, now start executing next body
        execute(tail + 1, tailPointer);
    }

    private void executeOperation(OperationDTO dto) {
        BiFunction<String, String, String> toRef = (type, part) -> dto.getOperationId() + ".(" + type + ")." + part;

        Pagination pagination = null;
        if (dto.getOperationType() == OpType.PAGINATION) {
            pagination = dto.getPagination() != null ? dto.getPagination() : this.pagination;

            if (pagination != null) {
                pagination = pagination.clone();
            }
        }
        executionManager.setPagination(pagination);

        boolean hasMore = false;
        long duration = 0;
        RequestEntity<?> requestEntity;
        Class<?> responseType;
        ResponseEntity<?> responseEntity;
        do {
            requestEntity = RequestEntityBuilder.start()
                    .forOperation(dto)
                    .usingReferences(executionManager::getValue)
                    .createRequest();

            URI uri = requestEntity.getUrl();
            if (pagination != null && pagination.existsParam(PageParam.LINK)) {
                String nextElemLink = pagination.findParam(PageParam.LINK).getValue();
                if (nextElemLink != null && !nextElemLink.isEmpty()) {
                    try {
                        uri = new URI(nextElemLink);
                    } catch (URISyntaxException e) {
                        throw new RuntimeException(e);
                    }
                }
            }

            logger.logAndSend(String.format("segment=REQUEST url=%s http_method=%s", masking.applyMask(uri, toRef.apply("request", "url")), requestEntity.getMethod()));
            logger.logAndSend(String.format("segment=REQUEST_HEADER data=%s", masking.applyMask(requestEntity.getHeaders(), toRef.apply("request", "header"))));
            logger.logAndSend(String.format("segment=REQUEST_PAYLOAD data=%s", masking.applyMask(requestEntity.getBody(), toRef.apply("request", "body"))));

            HttpEntity<Object> httpEntity = new HttpEntity<>(requestEntity.getBody(), requestEntity.getHeaders());
            responseType = getResponseType(dto);

            long startTime = System.currentTimeMillis();
            responseEntity = this.restTemplate.exchange(uri, requestEntity.getMethod(), httpEntity, responseType);
            duration += (System.currentTimeMillis() - startTime);

            if (pagination != null) {
                pagination.updateParamValues(responseEntity, responseType);
                hasMore = pagination.hasMore();
            }
        } while (hasMore);

        if (responseType.equals(byte[].class)) {
            byte[] fileBytes = (byte[]) responseEntity.getBody();
            String base64Encoded = Base64.getEncoder().encodeToString(fileBytes);

            responseEntity = new ResponseEntity<>(base64Encoded,
                    responseEntity.getHeaders(),
                    responseEntity.getStatusCode());
        }

        if (pagination != null) {
            String paginatedBody = pagination.findParam(PageParam.RESULT).getValue();
            responseEntity = new ResponseEntity<>(paginatedBody,
                    responseEntity.getHeaders(),
                    responseEntity.getStatusCode());

            // remove reference for used pagination
            pagination = null;
            executionManager.setPagination(pagination);
        }
        logger.logAndSend(String.format("segment=RESPONSE status=%d duration=%dms", responseEntity.getStatusCode().value(), duration));
        logger.logAndSend(String.format("segment=RESPONSE_HEADER data=%s", masking.applyMask(responseEntity.getHeaders(), toRef.apply("response", "header"))));
        logger.logAndSend(String.format("segment=RESPONSE_PAYLOAD data=%s", masking.applyMask(responseEntity.getBody(), toRef.apply("response", "body"))));

        Operation operation = executionManager.findOperationByColor(dto.getOperationId())
                .orElseGet(() -> {
                    int loopDepth = executionManager.getLoops().size(); // in which depth the operation is executed

                    Operation newOperation = Operation.fromDTO(dto, loopDepth);
                    executionManager.addOperation(newOperation);

                    return newOperation;
                });

        String key = executionManager.generateKey(operation.getLoopDepth());

        operation.addRequest(key, requestEntity);
        operation.addResponse(key, responseEntity);
    }

    private Class<?> getResponseType(OperationDTO dto) {
        MediaType mediaType = MediaType.APPLICATION_JSON;
        for (ResponseDTO response : dto.getResponses()) {
            if ("success".equals(response.getStatus())) {
                mediaType = response.getContent();
            }
        }

        if (isJsonCompatible(mediaType)) {
            return Object.class;
        } else if (isBinaryCompatible(mediaType)) {
            return byte[].class;
        } else {
            return String.class;
        }
    }

    private int getTailPointer(int headPointer) {
        String index = getIndex(executables.get(headPointer)) + "_";

        for (headPointer++; headPointer < executables.size(); headPointer++) {
            if (!getIndex(executables.get(headPointer)).startsWith(index)) {
                break;
            }
        }

        return headPointer - 1;
    }

    public String getLoopData() {
        List<Loop> loops = executionManager.getLoops();
        if (loops.isEmpty()) {
            return "";
        }

        // loopIterator="i,j" loopIndex="0,1"
        String loopIterator = loops.stream()
                .map(Loop::getIterator)
                .collect(Collectors.joining(","));

        String loopIndex = loops.stream()
                .map(loop -> String.valueOf(loop.getIndex()))
                .collect(Collectors.joining(","));

        return String.format("loopIterator=\"%s\" loopIndex=\"%s\"", loopIterator, loopIndex);
    }

    private static Comparator<Object> getComparator() {
        return (o1, o2) -> {
            String[] arr1 = getIndex(o1).split("_");
            String[] arr2 = getIndex(o2).split("_");

            for (int i = 0; i < arr1.length && i < arr2.length; i++) {
                // skip equal elements until there is a difference found
                if (Objects.equals(arr1[i], arr2[i])) continue;

                // if there is an unequal elements then return their difference
                return Integer.parseInt(arr1[i]) - Integer.parseInt(arr2[i]);
            }

            // at this point one array contains the other one
            // so array with greater length is greater
            return arr1.length - arr2.length;
        };
    }

    private static String getIndex(Object o) {
        if (o instanceof OperationDTO) {
            return ((OperationDTO) o).getExecOrder();
        } else if (o instanceof OperatorEx) {
            return ((OperatorEx) o).getIndex();
        } else {
            throw new RuntimeException("getIndex() is only applicable to OperationDTO and OperatorEX");
        }
    }
}

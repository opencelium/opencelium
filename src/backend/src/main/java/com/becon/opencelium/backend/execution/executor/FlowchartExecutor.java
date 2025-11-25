package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.enums.LogType;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.logger.msg.ConnectorLog;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.logger.msg.MethodData;
import com.becon.opencelium.backend.execution.model.Connector;
import com.becon.opencelium.backend.execution.model.Loop;
import com.becon.opencelium.backend.execution.model.Operation;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.ocel.ProcessorType;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
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
import java.util.stream.IntStream;

import static com.becon.opencelium.backend.utility.MediaTypeUtility.isBinaryCompatible;
import static com.becon.opencelium.backend.utility.MediaTypeUtility.isJsonCompatible;

public class FlowchartExecutor {
    private final ExpressionProcessor expressionProcessor;
    private final Connector connector;
    private final ExecutionManager executionManager;
    private final RestTemplate restTemplate;
    private final List<Object> executables;
    private final OcLogger<ExecutionLog> logger;
    private final MaskingService masking;

    // log related variables:
    private final String flowId;
    private final int connectorId;
    private final String connectorName;
    private final String direction;
    private final Stack<String> endPhases = new Stack<>();


    public FlowchartExecutor(
            ConnectorEx connectorEx, ExecutionManager executionManager,
            RestTemplate restTemplate, OcLogger<ExecutionLog> logger,
            MaskingService masking, String direction
    ) {
        this.expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);
        this.executionManager = executionManager;
        this.restTemplate = restTemplate;
        this.logger = logger;
        this.masking = masking;

        this.executables = new ArrayList<>();
        if (Objects.nonNull(connectorEx.getMethods())) {
            connectorEx.getMethods().forEach(o -> {
                o.setInvoker(connectorEx.getInvoker());
                executables.add(o);
            });
        }
        if (Objects.nonNull(connectorEx.getOperators())) {
            this.executables.addAll(connectorEx.getOperators());
        }
        this.executables.sort(getComparator());

        this.connector = Connector.fromEx(connectorEx);

        // initialize log related variables:
        this.flowId = connectorEx.getFchartId();
        this.connectorId = connectorEx.getId();
        this.connectorName = connectorEx.getName();
        this.direction = direction;
    }

    public void start() {
        logger.getLogEntity().setType(LogType.INFO);
        logger.getLogEntity().setConnector(new ConnectorLog(connectorName, "source".equals(direction) ? "CONN1" : "CONN2"));
        logger.logAndSend(String.format("phase=FLOWCHART_START flowId=%s connectorId=%d connectorName=%s direction=%s", flowId, connectorId, connectorName, direction));
        endPhases.push(String.format("phase=FLOWCHART_END flowId=%s connectorId=%d connectorName=%s direction=%s", flowId, connectorId, connectorName, direction));

        try {
            executionManager.setCurrentCtorId(connector.getId());

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
            flushEndPhases();
        }
    }

    private void execute(int headPointer, int tailPointer) {
        if (headPointer > tailPointer) {
            return;
        }

        Object executable = executables.get(headPointer);
        int tail = getTailPointer(headPointer);
        String index = getIndex(executable);

        if (executable instanceof OperationDTO operation) {
            logger.getLogEntity().setMethodData(new MethodData(operation.getOperationId()));
            logger.logAndSend(String.format("phase=OPERATION_START indexPath=%s name=\"%s\" %s", index, operation.getName(), getLoopData()));
            endPhases.push(String.format("phase=OPERATION_END indexPath=%s name=\"%s\" %s", index, operation.getName(), getLoopData()));

            executeOperation(operation);

            logger.logAndSend(endPhases.pop());
            logger.getLogEntity().setMethodData(null);
        } else if (executable instanceof OperatorEx operator && "if".equals(operator.getType())) {
            logger.logAndSend(String.format("phase=IF_START indexPath=%s expression=(%s) %s", index, operator.getExpression(), getLoopData()));
            endPhases.push(String.format("phase=IF_END indexPath=%s %s", index, getLoopData()));
            endPhases.push("segment=IF_RESULT data=unknown"); // if exception occurs this will be logged, otherwise will just be skipped

            boolean result = (Boolean) expressionProcessor.evaluate(
                    operator.getExpression(),
                    executionManager::getValue,
                    logger,
                    masking
            );

            endPhases.pop(); // potential exception case message is skipped
            logger.logAndSend("segment=IF_RESULT data=" + result);

            if (result) {
                execute(headPointer + 1, tail);
            }
            logger.logAndSend(endPhases.pop());

        } else if (executable instanceof OperatorEx operator && "loop".equals(operator.getType())) {
            Loop loop = Loop.fromEx(operator);
            List<String> values = buildLoopValues(loop);

            logger.logAndSend(String.format("phase=LOOP_START indexPath=%s expression=(%s) size=%d iterator=\"%s\" %s", index, loop.getRef(), values.size(), loop.getIterator(), getLoopData()));
            logger.logAndSend(String.format("segment=LOOP_REF ref=(%s) data=%s", loop.getRef(), values.stream().collect(Collectors.joining(", ", "[", "]"))));
            endPhases.push(String.format("phase=LOOP_END indexPath=%s %s", index, getLoopData()));

            executionManager.getLoops().add(loop);
            for (int i = 0; i < values.size(); i++) {
                // update currently executing loops' data
                loop.setIndex(i);
                loop.setValue(values.get(i));

                execute(headPointer + 1, tail);
            }
            executionManager.getLoops().remove(loop);

            logger.logAndSend(endPhases.pop());
        } else {
            throw new RuntimeException("Wrong type is supplied");
        }

        // we already executed operations'/operators' body, now start executing next body
        execute(tail + 1, tailPointer);
    }

    private void executeOperation(OperationDTO dto) {
        BiFunction<String, String, String> toRef = (type, part) -> dto.getOperationId() + ".(" + type + ")." + part;

        Pagination pagination = null;
        if (dto.getOperationType() == OpType.PAGINATION) {
            pagination = dto.getPagination() != null ? dto.getPagination() : connector.getPagination();

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

    private List<String> buildLoopValues(Loop loop) {
        Object referencedList = executionManager.getValue(loop.getRef());
        if (ObjectUtils.isEmpty(referencedList)) {
            return Collections.emptyList();
        }

        return switch (loop.getOperator()) {
            case FOR -> IntStream.range(0, ((List<Object>) referencedList).size())
                    .mapToObj(String::valueOf)
                    .toList();

            case FOR_IN -> (List<String>) referencedList;

            case SPLIT_STRING -> List.of(((String) referencedList).split(loop.getDelimiter()));

            default -> Collections.emptyList();
        };
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

    private void flushEndPhases() {
        while (!endPhases.isEmpty()) {
            logger.logAndSend(endPhases.pop());
        }
    }
}

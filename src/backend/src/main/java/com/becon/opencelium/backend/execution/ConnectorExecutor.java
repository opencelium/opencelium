package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.LogType;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.logger.msg.ConnectorLog;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.logger.msg.MethodData;
import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
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
import com.becon.opencelium.backend.utility.Comparators;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
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

public class ConnectorExecutor {
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


    public ConnectorExecutor(
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
        this.executables.sort(
                Comparator.comparing(
                        ConnectorExecutor::extractIndex,
                        Comparators.NUMERIC_PARTS
                )
        );

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
            while (!endPhases.isEmpty()) {
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
        String index = extractIndex(executables.get(headPointer));

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
                Loop loop = Loop.fromOperator(operator);
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
        ResponseEntity<?> responseEntity;
        Class<?> responseType = getResponseType(dto);
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

            long startTime = System.currentTimeMillis();
            responseEntity = sendRequest(uri, requestEntity, responseType);
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

    private ResponseEntity<?> sendRequest(URI uri, RequestEntity<?> requestEntity, Class<?> responseType) {
        HttpEntity<Object> httpEntity = new HttpEntity<>(requestEntity.getBody(), requestEntity.getHeaders());

        try {
            return this.restTemplate.exchange(uri, requestEntity.getMethod(), httpEntity, responseType);
        } catch (Exception e) {
            return convertException(e);
        }
    }

    private ResponseEntity<?> convertException(Exception e) {
        if (e instanceof HttpStatusCodeException sce) {
            return ResponseEntity.status(sce.getStatusCode())
                    .headers(sce.getResponseHeaders())
                    .body(sce.getResponseBodyAsString());
        } else if (e instanceof ResourceAccessException rae) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Connection/Resource access error: " + rae.getMessage());
        } else if (e instanceof RestClientException rce) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("General client error: " + rce.getMessage());
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error: " + e.getMessage());
        }
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
        String index = extractIndex(executables.get(headPointer)) + "_";

        for (headPointer++; headPointer < executables.size(); headPointer++) {
            if (!extractIndex(executables.get(headPointer)).startsWith(index)) {
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

    private static String extractIndex(Object o) {
        if (o instanceof OperationDTO operation) {
            return operation.getExecOrder();
        } else if (o instanceof OperatorEx operator) {
            return operator.getIndex();
        }

        throw new IllegalArgumentException("Unsupported executable type: " + o.getClass());
    }
}

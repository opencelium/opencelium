package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.LogType;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.exception.ExecutionTerminatedException;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.ThreadLocalOcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ConnectorLog;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.logger.msg.MethodData;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.ocel.ProcessorType;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import com.becon.opencelium.backend.utility.Comparators;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

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

public class ConnectorExecutor {
    private final ExpressionProcessor expressionProcessor;
    private final ExecutionManager executionManager;
    private final List<Object> executables;
    private final OcLogger<ExecutionLog> logger;
    private final MaskingService masking;
    private final Pagination pagination;

    // log related variables:
    private final String flowId;
    private final int connectorId;
    private final String connectorName;
    private final String direction;
    private final Stack<String> endPhases = new Stack<>();


    public ConnectorExecutor(
            ConnectorEx connectorEx, ExecutionManager executionManager,
            MaskingService masking, String direction
    ) {
        this.expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);
        this.executionManager = executionManager;
        this.executables = buildExecutables(connectorEx);
        this.logger = ThreadLocalOcLogger.get();
        this.masking = masking;
        this.pagination = connectorEx.getPagination();

        // initialize log related variables:
        this.flowId = connectorEx.getFchartId();
        this.connectorId = connectorEx.getId();
        this.connectorName = connectorEx.getName();
        this.direction = direction;
    }

    public void start() {
        executionManager.putConnectorId(connectorId);

        checkInterrupted();

        logger.getLogEntity().setType(LogType.INFO);
        logger.getLogEntity().setConnector(new ConnectorLog(connectorName, "source".equals(direction) ? "CONN1" : "CONN2"));
        logger.logAndSend(String.format("phase=FLOWCHART_START flowId=%s connectorId=%d connectorName=%s direction=%s", flowId, connectorId, connectorName, direction));
        endPhases.push(String.format("phase=FLOWCHART_END flowId=%s connectorId=%d connectorName=%s direction=%s", flowId, connectorId, connectorName, direction));

        try {
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
        checkInterrupted();

        if (headPointer > tailPointer) {
            return;
        }

        // points to the end of the operator body
        int tail = getTailPointer(headPointer);

        Object executable = executables.get(headPointer);
        String index = extractIndex(executable);
        if (executable instanceof OperationDTO operation) {
            logger.getLogEntity().setMethodData(new MethodData(operation.getOperationId()));
            logger.logAndSend(String.format("phase=OPERATION_START indexPath=%s name=\"%s\" %s", index, operation.getName(), getLoopData()));
            endPhases.push(String.format("phase=OPERATION_END indexPath=%s name=\"%s\" %s", index, operation.getName(), getLoopData()));
            executionManager.putConnectorId(operation.getConnectorId());

            executeOperation(operation);

            executionManager.putConnectorId(connectorId);
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
        } else if (executable instanceof OperatorEx operator) { // LOOP cases = [for, forin, SplitString]
            Loop loop = Loop.fromOperator(operator);
            List<String> values = buildLoopValues(loop);
            int length = values.size();

            logger.logAndSend(String.format("phase=LOOP_START indexPath=%s expression=(%s) size=%d iterator=\"%s\" %s", index, loop.getRef(), length, loop.getIterator(), getLoopData()));
            logger.logAndSend(String.format("segment=LOOP_REF ref=(%s) data=%s", loop.getRef(), values.stream().collect(Collectors.joining(", ", "[", "]"))));
            endPhases.push(String.format("phase=LOOP_END indexPath=%s %s", index, getLoopData()));

            executionManager.getLoops().add(loop);
            for (int i = 0; i < length; i++) {
                // update currently executing loops' data
                loop.setIndex(i);
                loop.setValue(values.get(i));

                execute(headPointer + 1, tail);
            }

            // remove executed loops' data
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

        Pagination pagination = resolvePagination(dto);
        executionManager.setPagination(pagination);

        boolean hasMore = false;
        long duration = 0;
        RequestEntity<?> requestEntity;
        ResponseEntity<?> responseEntity;
        Class<?> responseType = getResponseType(dto);
        do {
            checkInterrupted();

            requestEntity = RequestEntityBuilder.start()
                    .forOperation(dto)
                    .usingReferences(executionManager::getValue)
                    .createRequest();

            URI uri = resolveURI(requestEntity.getUrl(), pagination);

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
            executionManager.setPagination(pagination = null);
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
            return executionManager.getRestTemplate().exchange(uri, requestEntity.getMethod(), httpEntity, responseType);
        } catch (Exception e) {
            return convertException(e);
        }
    }

    private ResponseEntity<?> convertException(Exception e) {
        if (e instanceof RestClientResponseException rre) { // 4xx - 5xx
            HttpHeaders headers = rre.getResponseHeaders() != null ? rre.getResponseHeaders() : new HttpHeaders();

            return ResponseEntity
                    .status(rre.getStatusCode())
                    .headers(headers)
                    .body(rre.getResponseBodyAsString());
        }

        if (e instanceof ResourceAccessException rae) {
            Throwable root = rae.getMostSpecificCause();

            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Connection error: " + (root != null ? root.getMessage() : rae.getMessage()));
        }

        if (e instanceof RestClientException rce) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Client error: " + rce.getMessage());
        }

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Unexpected error: " + e.getMessage());
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

    private Pagination resolvePagination(OperationDTO dto) {
        if (dto.getOperationType() == OpType.PAGINATION) {
            Pagination pagination = dto.getPagination() != null ? dto.getPagination() : this.pagination;

            if (pagination != null) {
                return pagination.clone();
            }
        }

        return null;
    }

    private URI resolveURI(URI uri, Pagination pagination) {
        if (pagination == null || !pagination.existsParam(PageParam.LINK)) {
            return uri;
        }

        String nextLink = pagination.findParam(PageParam.LINK).getValue();
        if (nextLink == null || nextLink.isBlank()) {
            return uri;
        }

        try {
            return new URI(nextLink);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid pagination link URI: " + nextLink, e);
        }
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

    private void checkInterrupted() {
        if (Thread.currentThread().isInterrupted()) {
            Thread.interrupted(); // clear the flag
            throw new ExecutionTerminatedException("Execution terminated.");
        }
    }

    private List<Object> buildExecutables(ConnectorEx connector) {
        List<Object> result = new ArrayList<>();

        if (Objects.nonNull(connector.getMethods())) {
            connector.getMethods().forEach(o -> {
                o.setInvoker(connector.getInvoker());
                executables.add(o);
            });
        }

        if (Objects.nonNull(connector.getOperators())) {
            this.executables.addAll(connector.getOperators());
        }
        this.executables.sort(
                Comparator.comparing(
                        ConnectorExecutor::extractIndex,
                        Comparators.NUMERIC_PARTS
                )
        );

        return result;
    }

    private void flushEndPhases() {
        while (!endPhases.isEmpty()) {
            logger.logAndSend(endPhases.pop());
        }
    }
}

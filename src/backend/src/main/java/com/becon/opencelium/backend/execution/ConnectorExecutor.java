package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.LogType;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ConnectorLog;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.logger.msg.MethodData;
import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.execution.operator.Operator;
import com.becon.opencelium.backend.execution.operator.factory.OperatorAbstractFactory;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.invoker.enums.PageParam;
import com.becon.opencelium.backend.resource.execution.ConditionEx;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import com.becon.opencelium.backend.utility.MediaTypeUtility;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public class ConnectorExecutor {

    private final Connector connector;
    private final ExecutionManager executionManager;
    private final RestTemplate restTemplate;
    private final List<Object> executables;
    private final OcLogger<ExecutionLog> logger;
    private final String direction;
    private static final String BREAK = "======================= %s %s -- INDEX: %s =======================";

    public ConnectorExecutor(ConnectorEx connectorEx, ExecutionManager executionManager, RestTemplate restTemplate, OcLogger<ExecutionLog> logger, String direction) {
        this.executionManager = executionManager;
        this.restTemplate = restTemplate;
        this.logger = logger;
        this.direction = direction;

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
    }

    public void start() {
        logger.getLogEntity().setType(LogType.INFO);
        logger.getLogEntity().setConnector(new ConnectorLog(connector.getName(), direction));

        // set id of currently executing connector
        executionManager.setCurrentCtorId(connector.getId());

        int headPointer = 0;

        while (headPointer < executables.size()) {
            int tailPointer = getTailPointer(headPointer);

            execute(headPointer, tailPointer, false, -1, -1);

            headPointer = tailPointer + 1;
        }
    }

    private void execute(int headPointer, int tailPointer, boolean hasCircle, int loopHead, int loopTail) {
        if (headPointer > tailPointer) {
            return;
        }

        // points to the end of the operator body
        int tail = getTailPointer(headPointer);
        // holds index of current executable
        String index = getIndex(executables.get(headPointer));
        // holds [next function index, next operator index] for current executable
        String[] next = getNextIndex(headPointer, hasCircle, loopHead, loopTail);

        if (executables.get(headPointer) instanceof OperationDTO operation) {
            if (headPointer != tail) {
                throw new RuntimeException("Methods cannot have body");
            }

            // set up logger for the current operation
            logger.getLogEntity().setMethodData(new MethodData(operation.getOperationId()));
            logger.logAndSend(String.format(BREAK, "API OPERATION", "START", index));
            logger.logAndSend(String.format(
                    "Function: %s -- next function: %s -- next operator: %s -- index: %s",
                    operation.getName(), next[0], next[1], index
            ));

            executeOperation(operation);

            logger.logAndSend(String.format(BREAK, "API OPERATION", "END", index));
            // clean up after operation execution
            logger.getLogEntity().setMethodData(null);
        } else if (executables.get(headPointer) instanceof OperatorEx operator) {
            if (Objects.equals(operator.getType(), "if")) {
                logger.logAndSend(String.format(BREAK, operator.getCondition().getRelationalOperator(), "START", index));
                logger.logAndSend(String.format(
                        "=============== %s =============== -- next function: %s -- next operator: %s -- index: %s",
                        operator.getCondition().getRelationalOperator(), next[0], next[1], index
                ));

                boolean result = executeIfOperator(operator);
                logger.logAndSend("OPERATOR_RESULT: " + (result ? "TRUE" : "FALSE") + " -- index: " + index);

                if (result) {
                    // if result is true, then execute if operators' body
                    execute(headPointer + 1, tail, hasCircle, loopHead, loopTail);
                }
            } else {
                Loop loop = Loop.fromEx(operator);
                Object referencedList = executionManager.getValue(loop.getRef());
                List<String> list = new ArrayList<>();

                logger.logAndSend(String.format(BREAK, loop.getOperator().toString().toUpperCase(), "START", index));

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
                logger.logAndSend("LOOP_OPERATOR_RESULT: " + (length == 0 ? "EMPTY" : "NOT_EMPTY") + " -- index: " + index);

                executionManager.getLoops().add(loop);
                for (int i = 0; i < length; i++) {
                    logger.logAndSend("Loop: " + loop.getRef() + " -------- index: " + i);

                    // update currently executing loops' data
                    loop.setIndex(i);
                    loop.setValue(list.get(i));

                    // if length !=0, then execute loop operators' body,
                    // there will be a circle if current run is not last one
                    execute(headPointer + 1, tail, i < length - 1, headPointer, tail);
                }

                // remove executed loops' data
                executionManager.getLoops().remove(loop);
            }

            // log after executing operator
            next = getNextIndex(tail, hasCircle, loopHead, loopTail);
            logger.logAndSend("============================================================================");
            logger.logAndSend(String.format(
                    "Operator: -- next function: %s -- next operator: %s -- type: %s -- index: %s",
                    next[0], next[1], operator.getType(), index)
            );
            logger.logAndSend(String.format(BREAK, operator.getCondition().getRelationalOperator(), "END", index));
        } else {
            throw new RuntimeException("Wrong type is supplied");
        }

        // we already executed operations'/operators' body, now start executing next body'
        execute(tail + 1, tailPointer, hasCircle, loopHead, loopTail);
    }

    private void executeOperation(OperationDTO dto) {
        Pagination pagination = null;
        if (dto.getOperationType() == OpType.PAGINATION) {
            pagination = dto.getPagination() != null ? dto.getPagination() : connector.getPagination();

            if (pagination != null) {
                pagination = pagination.clone();
            }
        }
        executionManager.setPagination(pagination);

        boolean hasMore = false;
        RequestEntity<?> requestEntity;
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

            logger.logAndSend("Http Method: " + requestEntity.getMethod());
            logger.logAndSend("URL: " + uri);
            logger.logAndSend("Header: " + requestEntity.getHeaders());
            logger.logAndSend("Body: " + requestEntity.getBody());
            logger.logAndSend("============================================================================");

            HttpEntity<Object> httpEntity = new HttpEntity<>(requestEntity.getBody(), requestEntity.getHeaders());
            Class<?> responseType = getResponseType(dto);

            responseEntity = this.restTemplate.exchange(uri, requestEntity.getMethod(), httpEntity, responseType);

            if (pagination != null) {
                pagination.updateParamValues(responseEntity, responseType);
                hasMore = pagination.hasMore();
            }
        } while (hasMore);

        if (pagination != null) {
            String paginatedBody = pagination.findParam(PageParam.RESULT).getValue();
            responseEntity = new ResponseEntity<>(paginatedBody,
                    responseEntity.getHeaders(),
                    responseEntity.getStatusCode());
        }
        logger.logAndSend("Response : " + convertToStringIfNecessary(responseEntity.getBody()));

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

    private boolean executeIfOperator(OperatorEx operatorDTO) {
        ConditionEx condition = operatorDTO.getCondition();
        Object leftValue = executionManager.getValue(condition.getLeft());
        if (leftValue != null) {
            logger.logAndSend("Left Statement: " + leftValue);
        }

        Object rightValue;
        String likeValueRef = condition.getRight();
        if (condition.getRight() != null && condition.getRelationalOperator() == RelationalOperator.LIKE) {
            int beginIndex = likeValueRef.startsWith("%") ? 1 : 0;
            int endIndex = likeValueRef.length() - (likeValueRef.endsWith("%") ? 1 : 0);

            likeValueRef = likeValueRef.substring(beginIndex, endIndex);
        }

        if (ReferenceExtractor.isReference(likeValueRef)) {
            rightValue = executionManager.getValue(likeValueRef);
        } else {
            rightValue = likeValueRef;
        }

        if (condition.getRight() != null && condition.getRelationalOperator() == RelationalOperator.LIKE) {
            rightValue = condition.getRight().replace(likeValueRef, (String) rightValue);
        }

        if (rightValue != null) {
            if (rightValue.getClass().isArray()) {
                logger.logAndSend("Right Statement: " + Arrays.toString((String[]) rightValue));
            } else {
                logger.logAndSend("Right Statement: " + rightValue);
            }
        }

        Operator operator = OperatorAbstractFactory.getFactoryByType(OperatorType.COMPARISON).getOperator(condition.getRelationalOperator());

        return operator.apply(leftValue, rightValue);
    }

    private Class<?> getResponseType(OperationDTO dto) {
        MediaType mediaType = MediaType.APPLICATION_JSON;
        for (ResponseDTO response : dto.getResponses()) {
            if ("success".equals(response.getStatus())) {
                mediaType = response.getContent();
            }
        }

        return MediaTypeUtility.isJsonCompatible(mediaType) ? Object.class : String.class;
    }

    private String convertToStringIfNecessary(Object body) {
        if (body == null) {
            return "";
        } else if (body instanceof String result) {
            return result;
        }

        try {
            return new ObjectMapper().writer().withDefaultPrettyPrinter().writeValueAsString(body);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private int getTailPointer(int headPointer) {
        String index = getIndex(executables.get(headPointer));

        for (headPointer++; headPointer < executables.size(); headPointer++) {
            if (!getIndex(executables.get(headPointer)).startsWith(index)) {
                break;
            }
        }

        return headPointer - 1;
    }

    private String[] getNextIndex(int lastExecuted, boolean hasCircle, int loopHead, int loopTail) {
        String[] result = {"null", "null"};
        Object next;
        if (hasCircle && lastExecuted == loopTail) {
            next = executables.get(loopHead + 1);
        } else if (lastExecuted + 1 < executables.size()) {
            next = executables.get(lastExecuted + 1);
        } else {
            return result;
        }

        String index = getIndex(next);

        if (next instanceof OperationDTO) {
            result[0] = index;
        } else {
            result[1] = index;
        }

        return result;
    }

    private static Comparator<Object> getComparator() {
        return (o1, o2) -> {
            String[] arr1 = getIndex(o1).split("_");
            String[] arr2 = getIndex(o2).split("_");

            for (int i = 0; i < arr1.length && i < arr2.length; i++) {
                // skip equal elements until there is a difference found
                if (Objects.equals(arr1[i], arr2[i])) continue;

                // if there is an unequal elements then return their difference
                return arr1[i].compareTo(arr2[i]);
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

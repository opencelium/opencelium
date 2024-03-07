package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.operator.Operator;
import com.becon.opencelium.backend.execution.operator.factory.OperatorAbstractFactory;
import com.becon.opencelium.backend.resource.execution.ConditionEx;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTOUtil;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public class ConnectorExecutor {
    private final Connector connector;
    private final ExecutionManager executionManager;
    private final RestTemplate restTemplate;
    private final List<Object> executables;

    public ConnectorExecutor(ConnectorEx connectorEx, ExecutionManager executionManager, RestTemplate restTemplate) {
        this.executionManager = executionManager;
        this.restTemplate = restTemplate;

        this.executables = new ArrayList<>();
        this.executables.addAll(connectorEx.getMethods());
        this.executables.addAll(connectorEx.getOperators());
        this.executables.sort(getComparator());

        this.connector = Connector.fromEx(connectorEx);
    }

    public void start() {
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

        int tail = getTailPointer(headPointer);

        if (executables.get(headPointer) instanceof OperationDTO operation) {
            if (headPointer != tail) {
                throw new RuntimeException("Methods cannot have body");
            }

            System.out.println("Function before: -- index: " + operation.getExecOrder() + " " + Arrays.toString(getNextIndex(headPointer, hasCircle, loopHead, loopTail)));
            executeOperation(operation);
        } else if (executables.get(headPointer) instanceof OperatorEx operator) {
            if (Objects.equals(operator.getType(), "if")) {
                System.out.println("IF before: -- index: " + operator.getIndex() + " " + Arrays.toString(getNextIndex(headPointer, hasCircle, loopHead, loopTail)));
                boolean result = executeIfOperator(operator);

                if (result) {
                    System.out.println("IF after: -- index: " + operator.getIndex() + " " + Arrays.toString(getNextIndex(headPointer, hasCircle, loopHead, loopTail)));
                    execute(headPointer + 1, tail, hasCircle, loopHead, loopTail);
                } else {
                    System.out.println("IF after: -- index: " + operator.getIndex() + " " + Arrays.toString(getNextIndex(tail, hasCircle, loopHead, loopTail)));
                }
            } else {
                int length = executeForOperator(operator);

                for (int i = 0; i < length; i++) {
                    executionManager.getLoops().put(operator.getIterator(), String.valueOf(i));
                    execute(headPointer + 1, tail, i < length - 1, headPointer, tail);
                }
                System.out.println("LOOP after: -- index: " + operator.getIndex() + " " + Arrays.toString(getNextIndex(tail, hasCircle, loopHead, loopTail)));
                executionManager.getLoops().remove(operator.getIterator());
            }
        } else {
            throw new RuntimeException("Wrong type is supplied");
        }

        execute(tail + 1, tailPointer, hasCircle, loopHead, loopTail);
    }

    private void executeOperation(OperationDTO operationDTO) {
        RequestEntity<?> requestEntity = RequestEntityBuilder.start()
                .forOperation(operationDTO)
                .usingReferences(this::resolveReferences)
                .createRequest();

        ResponseEntity<?> responseEntity = this.restTemplate.exchange(requestEntity, Object.class);

        Operation operation = executionManager.findOperationByColor(operationDTO.getOperationId())
                .orElseGet(() -> {
                    int loopDepth = executionManager.getLoops().size(); // in which depth the operation is executed

                    Operation newOperation = Operation.fromDTO(operationDTO, loopDepth);
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
        Object rightValue = executionManager.getValue(condition.getRight());

        Operator operator = OperatorAbstractFactory.getFactoryByType(OperatorType.COMPARISON).getOperator(condition.getRelationalOperator());

        return operator.apply(leftValue, rightValue);
    }

    private int executeForOperator(OperatorEx operatorDTO) {
        String leftValueReference = operatorDTO.getCondition().getLeft();

        List<Object> loopingList = (List<Object>) executionManager.getValue(leftValueReference);

        return ObjectUtils.isEmpty(loopingList) ? 0 : loopingList.size();
    }

    private SchemaDTO resolveReferences(String ref) {
        Object value = executionManager.getValue(ref);

        return SchemaDTOUtil.fromObject(value);
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
        String[] result = new String[2];
        Object next;
        if (hasCircle && lastExecuted == loopTail) {
            next = executables.get(loopHead + 1);
        } else if (lastExecuted + 1 < executables.size()){
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

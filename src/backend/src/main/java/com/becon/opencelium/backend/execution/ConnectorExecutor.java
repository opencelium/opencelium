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
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.PriorityQueue;

public class ConnectorExecutor {
    private final Connector connector;
    private final ExecutionManager executionManager;
    private final RestTemplate restTemplate;
    // stores OperationDTO and OperatorEx in sorted order by their 'execOrder' and 'index' respectively;
    private final PriorityQueue<Object> executables;

    public ConnectorExecutor(ConnectorEx connectorEx, ExecutionManager executionManager, RestTemplate restTemplate) {
        this.executionManager = executionManager;
        this.restTemplate = restTemplate;

        this.executables = new PriorityQueue<>(getComparator());
        this.executables.addAll(connectorEx.getMethods());
        this.executables.addAll(connectorEx.getOperators());

        this.connector = Connector.fromEx(connectorEx);
    }

    public void start() {
        // set id of currently executing connector
        executionManager.setCurrentCtorId(connector.getId());

        // start connector execution
        List<Object> body;

        while (!executables.isEmpty()) {
            Object current = executables.peek();

            String head = getIndex(current);
            body = new ArrayList<>();

            while (current != null && getIndex(current).startsWith(head)) {

                body.add(executables.poll());

                // 'current' evaluates to null if queue become empty
                current = executables.peek();
            }

            execute(body, 0);
        }
    }

    private void execute(List<Object> body, int index) {
        // if 'body' is empty, then no need to execute
        // If 'index' = 'body.size' then all are executed so stop the recursion
        if (body.isEmpty() || body.size() <= index) {
            return;
        }

        if (body.get(index) instanceof OperationDTO) {
            executeOperation(body, index);
        } else {
            OperatorEx current = (OperatorEx) body.get(index);

            if (Objects.equals(current.getType(), "if")) {
                executeIfOperator(body, index);
            } else if (current.getIterator() != null) {
                executeForOperator(body, index);
            } else {
                executeForInOperator(body, index);
            }
        }
    }

    private void executeOperation(List<Object> body, int index) {
        OperationDTO operationDTO = (OperationDTO) body.get(index);

        RequestEntity<?> requestEntity = RequestEntityBuilder.start()
                .forOperation(operationDTO)
                .usingReferences(this::resolveReferences)
                .createRequest();

        ResponseEntity<?> responseEntity = this.restTemplate.exchange(requestEntity, Object.class);

        Operation operation = executionManager.findOperationByColor(operationDTO.getOperationId())
                .orElseGet(() -> {
                    Operation newOperation = Operation.fromDTO(operationDTO);
                    executionManager.addOperation(newOperation);

                    return newOperation;
                });

        String key = executionManager.generateKey();

        operation.addRequest(key, requestEntity);
        operation.addResponse(key, responseEntity);

        execute(body, ++index);
    }

    private void executeIfOperator(List<Object> body, int index) {
        OperatorEx operatorDTO = (OperatorEx) body.get(index);

        ConditionEx condition = operatorDTO.getCondition();
        Object leftValue = executionManager.getValue(condition.getLeft());
        Object rightValue = executionManager.getValue(condition.getRight());

        Operator operator = OperatorAbstractFactory.getFactoryByType(OperatorType.COMPARISON).getOperator(condition.getRelationalOperator());

        boolean result = operator.apply(leftValue, rightValue);

        // when 'if' evaluates to false, then remove its body.
        // Body contains executables that has 'execOrder' starting with 'execOrder' of 'if'
        String startingExecOrder = getIndex(operatorDTO);
        String currentExecOrder = getIndex(operatorDTO);

        while (!result && currentExecOrder.startsWith(startingExecOrder) && index < body.size()) {
            currentExecOrder = getIndex(body.get(index++));
        }

        execute(body, ++index);
    }

    private void executeForOperator(List<Object> body, int index) {
        OperatorEx operatorDTO = (OperatorEx) body.get(index);
        String leftValueReference = operatorDTO.getCondition().getLeft();

        List<Object> loopingList = (List<Object>) executionManager.getValue(leftValueReference);

        if (ObjectUtils.isEmpty(loopingList)) {
            return;
        }

        // move index to execute body of 'for' operator
        index++;
        for (int i = 0; i < loopingList.size(); i++) {
            // add current loops' 'iterator' and 'value'
            executionManager.getLoops().put(operatorDTO.getIterator(), String.valueOf(i));
            execute(body, index);
        }
        // remove executed loop from ExecutionManager
        executionManager.getLoops().remove(operatorDTO.getIterator());
    }

    private void executeForInOperator(List<Object> body, int index) {
        // TODO: need to implement
    }

    private SchemaDTO resolveReferences(String ref) {
        Object value = executionManager.getValue(ref);

        return SchemaDTOUtil.fromObject(value);
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

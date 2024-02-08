package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.operator.Operator;
import com.becon.opencelium.backend.execution.operator.factory.OperatorAbstractFactory;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.DataType;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTOUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.PriorityQueue;

import static com.becon.opencelium.backend.constant.RegExpression.directRef;
import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.queryParams;
import static com.becon.opencelium.backend.constant.RegExpression.requiredData;

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
                .usingReferences(this::mapToSchemaDTO)
                .createRequest();

        ResponseEntity<?> responseEntity = this.restTemplate.exchange(requestEntity, Object.class);

        Operation operation = executionManager.findOperationByColor(operationDTO.getOperationId())
                .orElseGet(() -> {
                    Operation newOperation = Operation.fromDTO(operationDTO);
                    executionManager.addOperation(newOperation);

                    return newOperation;
                });

        LinkedHashMap<String, String> loops = executionManager.getLoops();
        String key = Operation.generateKey(loops);

        operation.putRequest(key, requestEntity);
        operation.putResponse(key, responseEntity);

        execute(body, ++index);
    }

    private void executeIfOperator(List<Object> body, int index) {
        OperatorEx operatorDTO = (OperatorEx) body.get(index);

        Object leftValue = executionManager.getValue(operatorDTO.getCondition().getLeft());
        Object rightValue = executionManager.getValue(operatorDTO.getCondition().getRight());

        Operator operator = OperatorAbstractFactory.getFactoryByType(OperatorType.COMPARISON).getOperator(operatorDTO.getType());

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

    private SchemaDTO mapToSchemaDTO(String ref) {
        Object value = executionManager.getValue(ref);

        if (value == null) {
            return null;
        }

        // set default schema to result variable
        SchemaDTO result = new SchemaDTO(DataType.STRING, String.valueOf(value));

        if (ref.matches(queryParams)) {
            if (value instanceof Boolean) {
                result.setType(DataType.BOOLEAN);
            }

            if (value instanceof Long) {
                result.setType(DataType.INTEGER);
            }

            if (value instanceof Double) {
                result.setType(DataType.NUMBER);
            }

            if (value instanceof String[]) {
                result.setType(DataType.ARRAY);

                List<SchemaDTO> items = Arrays.stream((String[]) value)
                        .map(e -> new SchemaDTO(DataType.STRING, String.valueOf(e)))
                        .toList();

                result.setValue(null);
                result.setItems(items);
            }
        }

        if (ref.matches(requiredData)) {
            // required data is a string of single primitive value
        }

        if (ref.matches(enhancement)) {
            // TODO what types can script result be?
        }

        if (ref.matches(directRef)) {
            try {
                String jsonString = new ObjectMapper().writeValueAsString(value);

                return SchemaDTOUtil.fromJSON(jsonString);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
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

package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.resource.execution.Executable;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.OperatorDTO;
import com.becon.opencelium.backend.resource.execution.OperatorType;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.PriorityQueue;

public class ConnectorExecutor {

    // stores OperationDTO, and OperatorDTO in sorted order by execOrder;
    private final PriorityQueue<Executable> executables;
    private final ExecutionManager executionManager;
    private RestTemplate restTemplate;

    public ConnectorExecutor(PriorityQueue<Executable> executables, ExecutionManager executionManager) {
        this.executables = executables;
        this.executionManager = executionManager;
    }

    private void start() {
        List<Executable> body;

        while (!executables.isEmpty()) {
            Executable current = executables.peek();

            String head = current.getExecOrder();
            body = new ArrayList<>();

            while (current != null && current.getExecOrder().startsWith(head)) {

                body.add(executables.poll());

                // 'current' evaluates to null if queue become empty
                current = executables.peek();
            }

            execute(body, 0);
        }
    }

    private void execute(List<Executable> body, int index) {
        // if 'body' is empty, then no need to execute
        // If 'index' = 'body.size' then all are executed so stop the recursion
        if (body.isEmpty() || body.size() <= index) {
            return;
        }

        if (body.get(index) instanceof OperationDTO) {
            executeOperation(body, index);
        } else {
            OperatorDTO current = (OperatorDTO) body.get(index);

            if (current.getType() == OperatorType.IF) {
                executeIfOperator(body, index);
            } else if (current.getIterator() != null) {
                executeForOperator(body, index);
            } else {
                executeForInOperator(body, index);
            }
        }
    }

    private void executeOperation(List<Executable> body, int index) {
        OperationDTO operationDTO = (OperationDTO) body.get(index);

        RequestEntity<?> requestEntity = RequestEntityBuilder.start()
                .forOperation(operationDTO)
                .usingReferences(executionManager::getValueAsSchemaDTO)
                .createRequest();

        ResponseEntity<String> responseEntity = this.restTemplate.exchange(requestEntity, String.class);


        // TODO if not exists then save newly created operation
        Operation operation = executionManager.findOperationByColor(operationDTO.getOperationId())
                .orElseGet(() -> Operation.fromDTO(operationDTO));

        LinkedHashMap<String, String> loops = executionManager.getLoops();
        String key = generateKey(loops);

        operation.putRequest(key, requestEntity);
        operation.putResponse(key, responseEntity);

        execute(body, ++index);
    }

    private void executeIfOperator(List<Executable> body, int index) {
        OperatorDTO operatorDTO = (OperatorDTO) body.get(index);

        SchemaDTO leftValue = executionManager.getValueAsSchemaDTO(operatorDTO.getLeftValueReference());
        SchemaDTO rightValue = executionManager.getValueAsSchemaDTO(operatorDTO.getRightValueReference());

        boolean result = operatorDTO.getLogicalOperator().algorithm.apply(leftValue, rightValue);

        // when 'if' evaluates to false, then remove its body.
        // Body contains executables that has 'execOrder' starting with 'execOrder' of 'if'
        String startingExecOrder = operatorDTO.getExecOrder();
        String currentExecOrder = operatorDTO.getExecOrder();

        while (!result && currentExecOrder.startsWith(startingExecOrder) && index < body.size()) {
            currentExecOrder = body.get(index++).getExecOrder();
        }

        execute(body, ++index);
    }

    private void executeForOperator(List<Executable> body, int index) {
        OperatorDTO operatorDTO = (OperatorDTO) body.get(index);

        List<SchemaDTO> loopingList = executionManager.getValueAsSchemaDTO(operatorDTO.getLeftValueReference()).getItems();

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

    private void executeForInOperator(List<Executable> body, int index) {
        // TODO: need to implement
    }

    private String generateKey(LinkedHashMap<String, String> loops) {
        if (loops.isEmpty()) {
            return "#";
        }

        return String.join(", ", loops.values());
    }
}

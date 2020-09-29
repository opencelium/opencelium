package com.becon.opencelium.backend.execution2.executor;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.data.ExecutionData;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;

public class StatementExecution implements Execution {

    @Override
    public void start(ExecutionData executionData) {
        if (executionData.getAction() != StatementNode.class){
            return;
        }
        StatementNode currentStatement = (StatementNode) executionData.getAction();
        // if body of statement(if, for) is empty then return
        if (currentStatement.getBodyOperator() == null && currentStatement.getBodyFunction() == null) {
            return;
        }
        // Executing statement
        ExecutionType executionType = getExecutionType(currentStatement.getType());
        Execution execution = executionData.getExecutionInstance().get(executionType);
        execution.start(executionData);

        // after executing statement checking either we have next action or not
        // if next action doesn't exist then return
        if (currentStatement.getNextOperator() == null && currentStatement.getNextFunction() == null) {
            return;
        }
        // if next action exists then determine type of action. Either it is method or statement
        if (currentStatement.getNextOperator() != null) {
            execution = executionData.getExecutionInstance().get(ExecutionType.STATEMENT);
            executionData.setAction(currentStatement.getBodyOperator());
        } else {
            execution = executionData.getExecutionInstance().get(ExecutionType.METHOD);
            executionData.setAction(currentStatement.getBodyFunction());
        }
        execution.start(executionData);
    }

    private ExecutionType getExecutionType(String type) {
        switch (type) {
            case "if":
                return  ExecutionType.IFSTATEMENT;
            case "loop":
                return ExecutionType.FORSTATEMENT;
            default:
                throw new RuntimeException("Statement " + type + " not found!");
        }
    }
}

package com.becon.opencelium.backend.rbmq_execution.executor;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.rbmq_execution.mediator.ExecutionContext;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;

public class StatementExecution implements Execution {

    @Override
    public void start(ExecutionContext executionContext) {
        if (executionContext.getAction() != StatementNode.class){
            return;
        }
        StatementNode currentStatement = (StatementNode) executionContext.getAction();
        // if body of statement(if, for) is empty then return
        if (currentStatement.getBodyOperator() == null && currentStatement.getBodyFunction() == null) {
            return;
        }
        // Executing statement
        ExecutionType executionType = getExecutionType(currentStatement.getType());
        Execution execution = executionContext.getExecutionInstance().get(executionType);
        execution.start(executionContext);

        // after executing statement checking either we have next action or not
        // if next action doesn't exist then return
        if (currentStatement.getNextOperator() == null && currentStatement.getNextFunction() == null) {
            return;
        }
        // if next action exists then determine type of action. Either it is method or statement
        if (currentStatement.getNextOperator() != null) {
            execution = executionContext.getExecutionInstance().get(ExecutionType.STATEMENT);
            executionContext.setAction(currentStatement.getBodyOperator());
        } else {
            execution = executionContext.getExecutionInstance().get(ExecutionType.METHOD);
            executionContext.setAction(currentStatement.getBodyFunction());
        }
        execution.start(executionContext);
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

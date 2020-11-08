package com.becon.opencelium.backend.execution2.statement;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.executor.Execution;
import com.becon.opencelium.backend.execution2.mediator.ExecutionContext;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;

import java.util.ArrayList;

public class ForStatementExecution implements Execution {
    @Override
    public void start(ExecutionContext executionContext) {
        StatementNode statement = (StatementNode) executionContext.getAction();
        Execution execution = executionContext.getExecutionInstance().get(ExecutionType.METHOD);
        executionContext.setAction(statement.getBodyFunction());
        if (statement.getBodyOperator() != null) {
            execution = executionContext.getExecutionInstance().get(ExecutionType.STATEMENT);
            executionContext.setAction(statement.getBodyOperator());
        }
//        ArrayList<Object> array = getValue(statement.getRightStatementVariable());
        ArrayList<Object> array = new ArrayList<>();
        for (int i = 0; i < array.size(); i ++) {
            execution.start(executionContext);
        }
    }
}

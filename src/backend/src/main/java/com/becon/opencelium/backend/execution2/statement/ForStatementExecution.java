package com.becon.opencelium.backend.execution2.statement;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.executor.Execution;
import com.becon.opencelium.backend.execution2.data.ExecutionData;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;

import java.util.ArrayList;

public class ForStatementExecution implements Execution {
    @Override
    public void start(ExecutionData executionData) {
        StatementNode statement = (StatementNode) executionData.getAction();
        Execution execution = executionData.getExecutionInstance().get(ExecutionType.METHOD);
        executionData.setAction(statement.getBodyFunction());
        if (statement.getBodyOperator() != null) {
            execution = executionData.getExecutionInstance().get(ExecutionType.STATEMENT);
            executionData.setAction(statement.getBodyOperator());
        }
        ArrayList<Object> array = getValue(statement.getRightStatementVariable());
        for (int i = 0; i < array.size(); i ++) {
            execution.start(executionData);
        }
    }
}

package com.becon.opencelium.backend.execution2.statement;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.execution.statement.operator.Operator;
import com.becon.opencelium.backend.execution.statement.operator.factory.OperatorAbstractFactory;
import com.becon.opencelium.backend.execution2.executor.Execution;
import com.becon.opencelium.backend.execution2.data.ExecutionData;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;

public class IfStatementExecution implements Execution {
    @Override
    public void start(ExecutionData executionData) {
        StatementNode statement = (StatementNode) executionData.getAction();
        Object val1 = getValue(statement.getLeftStatementVariable());
        Object val2 = getValue(statement.getRightStatementVariable());

        // by default we assume that next action or body action could be method but below we will check type of action
        Execution nextExecution = executionData.getExecutionInstance().get(ExecutionType.METHOD);
        executionData.setAction(statement.getBodyFunction());

        // Body Action
        Operator operator = OperatorAbstractFactory
                .generateFactory(OperatorType.COMPARISON).getOperator(statement.getOperand());
        if (operator.compare(val1, val2)){
            if (statement.getBodyOperator() != null) {
                nextExecution = executionData.getExecutionInstance().get(ExecutionType.STATEMENT);
                executionData.setAction(statement.getBodyOperator());
            }
            nextExecution.start(executionData);
        }
    }
}

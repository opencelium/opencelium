package com.becon.opencelium.backend.rbmq_execution.statement;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.execution.statement.operator.Operator;
import com.becon.opencelium.backend.execution.statement.operator.factory.OperatorAbstractFactory;
import com.becon.opencelium.backend.rbmq_execution.executor.Execution;
import com.becon.opencelium.backend.rbmq_execution.mediator.ExecutionContext;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;

public class IfStatementExecution implements Execution {
    @Override
    public void start(ExecutionContext executionContext) {
        StatementNode statement = (StatementNode) executionContext.getAction();
//        Object val1 = getValue(statement.getLeftStatementVariable());
//        Object val2 = getValue(statement.getRightStatementVariable());
        Object val1 = "";
        Object val2 = "";

        // by default we assume that next action or body action could be method but below we will check type of action
        Execution nextExecution = executionContext.getExecutionInstance().get(ExecutionType.METHOD);
        executionContext.setAction(statement.getBodyFunction());

        // Body Action
        Operator operator = OperatorAbstractFactory
                .generateFactory(OperatorType.COMPARISON).getOperator(statement.getOperand());
        if (operator.compare(val1, val2)){
            if (statement.getBodyOperator() != null) {
                nextExecution = executionContext.getExecutionInstance().get(ExecutionType.STATEMENT);
                executionContext.setAction(statement.getBodyOperator());
            }
            nextExecution.start(executionContext);
        }
    }
}

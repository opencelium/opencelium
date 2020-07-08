package com.becon.opencelium.backend.execution.statement;

import com.becon.opencelium.backend.execution.statement.Statement;
import com.becon.opencelium.backend.execution.statement.operator.Operator;
import com.becon.opencelium.backend.execution.statement.operator.factory.OperatorFactory;
import com.becon.opencelium.backend.neo4j.entity.OperatorNode;

public class IfStatement implements Statement {
    @Override
    public void execute(OperatorNode operatorNode) {
        OperatorFactory operatorFactory = new OperatorFactory();
        Operator operator = operatorFactory.getOperator(operatorNode.getOperand());

    }
}

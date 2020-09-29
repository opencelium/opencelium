package com.becon.opencelium.backend.execution.statement;

import com.becon.opencelium.backend.execution.statement.operator.Operator;
import com.becon.opencelium.backend.execution.statement.operator.factory.ComparisonOperatorFactory;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;

public class IfStatement implements Statement {
    @Override
    public void execute(StatementNode statementNode) {
        ComparisonOperatorFactory comparisonOperatorFactory = new ComparisonOperatorFactory();
        Operator operator = comparisonOperatorFactory.getOperator(statementNode.getOperand());

    }
}

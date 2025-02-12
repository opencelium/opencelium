package com.becon.opencelium.backend.ocel;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.OperatorFactory;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;

import java.util.Objects;

public class OCExpressionHelper {
    public static String buildExp(ConditionMng condition) {
        StatementMng leftStatement = condition.getLeftStatement();
        StatementMng rightStatement = condition.getRightStatement();
        String op = condition.getRelationalOperator();

        OperatorEnum operatorEnum = OperatorEnum.fromName(op);

        if (Objects.isNull(operatorEnum)) {
            return null;
        }

        if (operatorEnum == OperatorEnum.FOR || operatorEnum == OperatorEnum.FOR_IN) {
            return operatorEnum.getName() + " " + buildOperand(leftStatement);
        }

        if (operatorEnum == OperatorEnum.SPLIT_STRING) {
            return buildOperand(leftStatement) + " " + operatorEnum.getName() + " " + buildOperand(rightStatement);
        }

        Operator operator = OperatorFactory.getOperator(operatorEnum);
        if (operator == null) {
            return null;
        }
        if (operator.getArity() == Arity.UNARY) {
            if (operator.isLeftSided()) {
                return operatorEnum.getName() + " " + buildOperand(rightStatement);
            } else {
                return buildOperand(leftStatement) + " " + operatorEnum.getName();
            }
        } else {
            if (operatorEnum == OperatorEnum.IS_TYPE_OF) {
                return buildOperand(leftStatement) + " " + operatorEnum.getName() + " " + buildOperand(rightStatement, false);
            }
            return buildOperand(leftStatement) + " " + operatorEnum.getName() + " " + buildOperand(rightStatement);
        }

    }

    private static String buildOperand(StatementMng statement, boolean quoted) {
        if (Objects.isNull(statement)) return "";
        if (Objects.isNull(statement.getType()) && Objects.isNull(statement.getColor())) {
            if (!quoted) return statement.getField();
            return "'" + statement.getField() + "'";
        } else {
            return "{%" + PathAndReferenceUtility.rebuildReference(statement.getColor(), statement.getType(), statement.getField()) + "%}";
        }
    }

    private static String buildOperand(StatementMng statement) {
        return buildOperand(statement, true);
    }
}

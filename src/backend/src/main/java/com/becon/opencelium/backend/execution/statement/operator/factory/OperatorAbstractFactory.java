package com.becon.opencelium.backend.execution.statement.operator.factory;

import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.execution.statement.operator.Operator;

public class OperatorAbstractFactory {
    public static OperatorFactory generateFactory(OperatorType operatorType) {
        switch (operatorType) {
            case COMPARISON:
                return new ComparisonOperatorFactory();
            default:
                throw new RuntimeException("Operator type" + operatorType + " not found!");
        }
    }
}

package com.becon.opencelium.backend.execution.operator.factory;

import com.becon.opencelium.backend.enums.OperatorType;

public class OperatorAbstractFactory {
    public static OperatorFactory getFactoryByType(OperatorType operatorType) {
        return switch (operatorType) {
            case COMPARISON -> new ComparisonOperatorFactory();
            case ARITHMETIC -> null;
            case LOGICAL -> null;
            case BITWISE -> null;
        };
    }
}

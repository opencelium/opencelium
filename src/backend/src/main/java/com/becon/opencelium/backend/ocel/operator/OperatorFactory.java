package com.becon.opencelium.backend.ocel.operator;

import com.becon.opencelium.backend.ocel.operator.operators.*;

public class OperatorFactory {

    public static Operator getOperator(OperatorEnum operator) {
        return switch (operator) {
            case AND -> new And();
            case OR -> new Or();
            case NOT -> new Not();
            case IS_NULL -> new IsNull();
            case NOT_NULL -> new NotNull();
            case EQUAL_TO -> new EqualTo();
            case NOT_EQUAL_TO -> new NotEqualTo();
            case LESS_THAN -> new LessThan();
            case LESS_THAN_OR_EQUAL_TO -> new LessThanOrEqualTo();
            case GREATER_THAN -> new GreaterThan();
            case GREATER_THAN_OR_EQUAL_TO -> new GreaterThanOrEqualTo();
            case IS_TYPE_OF -> new IsTypeOf();
            case IS_EMPTY -> new IsEmpty();
            case NOT_EMPTY -> new NotEmpty();
            case LIKE -> new Like();
            case NOT_LIKE -> new NotLike();
            case REGEX -> new RegEx();
            case MATCHES -> new Matches();
            default -> null;
        };
    }
}

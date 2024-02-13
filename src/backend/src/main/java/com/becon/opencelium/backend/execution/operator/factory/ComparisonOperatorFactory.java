package com.becon.opencelium.backend.execution.operator.factory;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.operator.Operator;
import com.becon.opencelium.backend.execution.operator.*;

public class ComparisonOperatorFactory implements OperatorFactory {

    public Operator getOperator(String relationalOperator) {
        RelationalOperator operator = RelationalOperator.fromName(relationalOperator);

        return switch (operator) {
            case CONTAINS -> new Contains();
            case NOT_CONTAINS -> new NotContains();
            case EQUAL_TO -> new EqualTo();
            case GREATER_THAN -> new GreaterThan();
            case GREATER_THAN_OR_EQUAL_TO -> new GreaterThanOrEqualTo();
            case LESS_THAN -> new LessThan();
            case LESS_THAN_OR_EQUAL_TO -> new LessThanOrEqualTo();
            case LIKE -> new Like();
            case MATCHES -> new Matches();
            case MATCHES_IN_LIST -> new MatchesInList();
            case NOT_LIKE -> new NotLike();
            case REGEX -> new RegEx();
            case PROPERTY_NOT_EXISTS -> new PropertyNotExists();
            case PROPERTY_EXISTS -> new PropertyExists();
            case IS_TYPE_OF -> new IsTypeOf();
            case IS_EMPTY -> new IsEmpty();
            case IS_NOT_EMPTY -> new IsNotEmpty();
            case IS_NOT_NULL -> new IsNotNull();
            case ISNULL -> new IsNull();
//            case NOTEQUALTO -> new NotEqualTo();
//            case CONTAINSSUBSTR -> new ContainsSubStr();
//            case NOTCONTAINSSUBSTR -> new NotContainsSubStr();
            case DEFAULT -> throw new RuntimeException("Operator '" + relationalOperator + "' is not supported");
        };
    }
}

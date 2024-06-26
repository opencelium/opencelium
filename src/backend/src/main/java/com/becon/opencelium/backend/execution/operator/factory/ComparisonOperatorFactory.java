package com.becon.opencelium.backend.execution.operator.factory;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.operator.Contains;
import com.becon.opencelium.backend.execution.operator.ContainsSubStr;
import com.becon.opencelium.backend.execution.operator.DenyList;
import com.becon.opencelium.backend.execution.operator.EqualTo;
import com.becon.opencelium.backend.execution.operator.GreaterThan;
import com.becon.opencelium.backend.execution.operator.GreaterThanOrEqualTo;
import com.becon.opencelium.backend.execution.operator.IsEmpty;
import com.becon.opencelium.backend.execution.operator.IsNotEmpty;
import com.becon.opencelium.backend.execution.operator.IsNotNull;
import com.becon.opencelium.backend.execution.operator.IsNull;
import com.becon.opencelium.backend.execution.operator.IsTypeOf;
import com.becon.opencelium.backend.execution.operator.LessThan;
import com.becon.opencelium.backend.execution.operator.LessThanOrEqualTo;
import com.becon.opencelium.backend.execution.operator.Like;
import com.becon.opencelium.backend.execution.operator.Matches;
import com.becon.opencelium.backend.execution.operator.MatchesInList;
import com.becon.opencelium.backend.execution.operator.NotContains;
import com.becon.opencelium.backend.execution.operator.NotContainsSubStr;
import com.becon.opencelium.backend.execution.operator.NotEqualTo;
import com.becon.opencelium.backend.execution.operator.NotLike;
import com.becon.opencelium.backend.execution.operator.Operator;
import com.becon.opencelium.backend.execution.operator.PropertyExists;
import com.becon.opencelium.backend.execution.operator.PropertyNotExists;
import com.becon.opencelium.backend.execution.operator.RegEx;

public class ComparisonOperatorFactory implements OperatorFactory {

    public Operator getOperator(RelationalOperator operator) {
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
            case IS_NULL -> new IsNull();
            case NOT_EQUAL_TO -> new NotEqualTo();
            case CONTAINS_SUB_STR -> new ContainsSubStr();
            case NOT_CONTAINS_SUB_STR -> new NotContainsSubStr();
            case DENY_LIST -> new DenyList();
            case DEFAULT -> throw new RuntimeException("Operator '" + operator.name() + "' is not supported");
            default -> null;
        };
    }
}

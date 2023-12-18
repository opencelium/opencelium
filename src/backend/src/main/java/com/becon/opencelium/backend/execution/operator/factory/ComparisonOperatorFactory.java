package com.becon.opencelium.backend.execution.operator.factory;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.operator.Operator;
import com.becon.opencelium.backend.execution.operator.*;

public class ComparisonOperatorFactory implements OperatorFactory {

    public Operator getOperator(String relationalOperator) {
        RelationalOperator operator = RelationalOperator.fromName(relationalOperator);

        return switch (operator) {
            case CONTAINS -> new Contains();
            case NOTCONTAINS -> new NotContains();
            case EQUALTO -> new EqualTo();
            case GREATERTHAN -> new GreaterThan();
            case GREATERTHANOREQUALTO -> new GreaterThanOrEqualTo();
            case LESSTHAN -> new LessThan();
            case LESSTHANOREQUALTO -> new LessThanOrEqualTo();
            case LIKE -> new Like();
            case MATCHES -> new Matches();
            case MATCHESINLIST -> new MatchesInList();
            case NOTLIKE -> new NotLike();
            case REGEX -> new RegEx();
            case PROPERTYNOTEXISTS -> new PropertyNotExists();
            case PROPERTYEXISTS -> new PropertyExists();
            case ISTYPEOF -> new IsTypeOf();
            case ISEMPTY -> new IsEmpty();
            case ISNOTEMPTY -> new IsNotEmpty();
            case ISNOTNULL -> new IsNotNull();
            case ISNULL -> new IsNull();
//            case NOTEQUALTO -> new NotEqualTo();
//            case CONTAINSSUBSTR -> new ContainsSubStr();
//            case NOTCONTAINSSUBSTR -> new NotContainsSubStr();
            case DEFAULT -> throw new RuntimeException("Operator '" + relationalOperator + "' is not supported");
        };
    }
}

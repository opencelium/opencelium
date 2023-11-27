package com.becon.opencelium.backend.execution.action;

import com.becon.opencelium.backend.resource.execution.SchemaDTO;

import java.util.function.BiFunction;

public enum LogicalOperator {
    CONTAINS(OperatorFunctions::contains),
    NOT_CONTAINS(OperatorFunctions::notContains),
    CONTAINS_SUB_STR(OperatorFunctions::containsSubStr),
    NOT_CONTAINS_SUB_STR(OperatorFunctions::notContainsSubStr),
    EQUAL_TO(OperatorFunctions::equalTo),
    NOT_EQUAL_TO(OperatorFunctions::notEqualTo),
    GREATER_THAN(OperatorFunctions::greaterThan),
    GREATER_THAN_OR_EQUAL_TO(OperatorFunctions::greaterThanOrEqualTo),
    LESS_THAN(OperatorFunctions::lessThan),
    LESS_THAN_OR_EQUAL_TO(OperatorFunctions::lessThanOrEqualTo),
    IS_EMPTY(OperatorFunctions::isEmpty),
    IS_NOT_EMPTY(OperatorFunctions::isNotEmpty),
    IS_NULL(OperatorFunctions::isNull),
    IS_NOT_NULL(OperatorFunctions::isNotNull),
    IS_TYPE_OF(OperatorFunctions::isTypeOf),
    LIKE(OperatorFunctions::like),
    NOT_LIKE(OperatorFunctions::notLike),
    MATCHES(OperatorFunctions::matches),
    MATCHES_IN_LIST(OperatorFunctions::matchesInList),
    PROPERTY_EXISTS(OperatorFunctions::propertyExists),
    PROPERTY_NOT_EXISTS(OperatorFunctions::propertyNotExists),
    REG_EX(OperatorFunctions::regEx);

    public final BiFunction<SchemaDTO, SchemaDTO, Boolean> algorithm;

    private LogicalOperator(BiFunction<SchemaDTO, SchemaDTO, Boolean> algorithm) {
        this.algorithm = algorithm;
    }
}

package com.becon.opencelium.backend.ocel.exceptions;

import com.becon.opencelium.backend.ocel.enums.OperatorEnum;

import java.util.List;

public class InvalidTypeException extends Exception {
    private final List<Class<?>> expectedTypes;
    private final OperatorEnum operator;
    private final Class<?> actualType;

    public InvalidTypeException() {
        this(null, null, null);
    }

    public InvalidTypeException(List<Class<?>> expectedTypes, OperatorEnum operator, Class<?> actualType) {
        this.expectedTypes = expectedTypes;
        this.operator = operator;
        this.actualType = actualType;
    }

    public static InvalidTypeException mismatchTypeException(OperatorEnum operator, List<Class<?>> expectedTypes, Class<?> actualType) {
        return new InvalidTypeException(expectedTypes, operator, actualType);
    }

    public List<Class<?>> getExpectedTypes() {
        return expectedTypes;
    }

    public OperatorEnum getOperator() {
        return operator;
    }

    public Class<?> getActualType() {
        return actualType;
    }
}

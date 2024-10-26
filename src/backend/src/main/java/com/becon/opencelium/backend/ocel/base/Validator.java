package com.becon.opencelium.backend.ocel.base;

import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;

public interface Validator {
    String validateAndStandardize(String expression) throws InvalidExpressionException;
    void validate(String expression) throws InvalidExpressionException;
    boolean isValid(String expression) throws InvalidExpressionException;
}

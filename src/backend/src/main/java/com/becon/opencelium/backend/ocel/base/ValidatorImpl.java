package com.becon.opencelium.backend.ocel.base;

import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;

public class ValidatorImpl implements Validator {

    @Override
    public String validateAndStandardize(String expression) throws InvalidExpressionException {
        return expression;
    }

    @Override
    public void validate(String expression) throws InvalidExpressionException {

    }

    @Override
    public boolean isValid(String expression) throws InvalidExpressionException {
        return true;
    }
}

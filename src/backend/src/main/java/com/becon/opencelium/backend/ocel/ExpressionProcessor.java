package com.becon.opencelium.backend.ocel;

import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;

import java.util.function.Function;

public interface ExpressionProcessor {
    Object evaluate(String expression) throws InvalidExpressionException;
    Object evaluate(String expression, Function<String, Object> refExtractor) throws InvalidExpressionException;
}

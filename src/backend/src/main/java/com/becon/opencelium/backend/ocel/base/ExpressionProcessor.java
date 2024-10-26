package com.becon.opencelium.backend.ocel.base;

import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;

import java.util.function.Function;

public interface ExpressionProcessor {
    boolean evaluate(String expression) throws InvalidExpressionException;
    boolean evaluate(String expression, Function<String, Object> refExtractor) throws InvalidExpressionException;
}

package com.becon.opencelium.backend.ocel.base;
import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;

import java.util.function.Function;

public interface Evaluator {
    boolean evaluate(String expression, Function<String, Object> referenceExtractor)
            throws InvalidExpressionException;
}

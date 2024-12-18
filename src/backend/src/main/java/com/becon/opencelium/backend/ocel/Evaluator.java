package com.becon.opencelium.backend.ocel;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.token.Token;

import java.util.List;
import java.util.function.Function;

public interface Evaluator {
    Object evaluate(List<Token> tokens, Function<String, Object> referenceExtractor)
            throws InvalidExpressionException;
}
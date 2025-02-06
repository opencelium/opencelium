package com.becon.opencelium.backend.ocel;

import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.token.Token;

import java.util.List;

public interface ShallowEvaluator {
    void check(List<Token> tokens) throws InvalidExpressionException;
}

package com.becon.opencelium.backend.ocel.base;

import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;

import java.util.List;

public interface ShallowEvaluator {
    void check(List<String> tokens) throws InvalidExpressionException;
}

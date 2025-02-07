package com.becon.opencelium.backend.ocel;

import com.becon.opencelium.backend.ocel.postfix.PostfixShallowEvaluator;

public abstract class ShallowEvaluatorFactory {
    public static ShallowEvaluator get(ShallowEvaluatorType type) {
        return switch (type) {
            case POSTFIX -> PostfixShallowEvaluator.getInstance();
            case NONE -> tokens -> {};
        };
    }
}
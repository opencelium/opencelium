package com.becon.opencelium.backend.ocel;

import com.becon.opencelium.backend.ocel.postfix.PostfixExpressionProcessor;

public abstract class ExpressionProcessorFactory {
    public static ExpressionProcessor get() {
        return get(ProcessorType.POSTFIX);
    }

    public static ExpressionProcessor get(ProcessorType type) {
        return switch (type) {
            case POSTFIX -> {
                Validator validator = Validator.withCustomShallowEvaluator(ShallowEvaluatorType.NONE);
                yield new PostfixExpressionProcessor(validator);
            }
        };
    }
}

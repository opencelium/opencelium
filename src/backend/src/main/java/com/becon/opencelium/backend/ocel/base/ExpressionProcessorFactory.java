package com.becon.opencelium.backend.ocel.base;

import com.becon.opencelium.backend.ocel.postfix.PostfixExpressionProcessor;

public abstract class ExpressionProcessorFactory {

    private ExpressionProcessorFactory() {
    }

    public static ExpressionProcessor get() {
        return get(ProcessorType.POSTFIX);
    }

    public static ExpressionProcessor get(ProcessorType type) {
        return switch (type) {
            case POSTFIX -> new PostfixExpressionProcessor(new ValidatorImpl());
        };
    }
}

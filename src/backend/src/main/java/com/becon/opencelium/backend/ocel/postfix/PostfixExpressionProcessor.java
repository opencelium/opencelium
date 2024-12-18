package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.ocel.Evaluator;
import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.Validator;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;

import java.util.function.Function;

public class PostfixExpressionProcessor implements ExpressionProcessor {
    private final Validator validator;
    private final Evaluator evaluator;

    public PostfixExpressionProcessor(Validator validator) {
        this.evaluator = PostfixEvaluator.getInstance();
        this.validator = validator;
    }

    @Override
    public Object evaluate(String expression) throws InvalidExpressionException {
        return evaluate(expression, null);
    }

    @Override
    public Object evaluate(String expression, Function<String, Object> refExtractor) throws InvalidExpressionException {
        return evaluator.evaluate(validator.validateAndTokenize(expression), refExtractor);
    }
}

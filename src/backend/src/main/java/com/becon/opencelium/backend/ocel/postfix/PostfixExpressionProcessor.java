package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.ocel.base.Evaluator;
import com.becon.opencelium.backend.ocel.base.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.base.Validator;

import java.util.function.Function;

public class PostfixExpressionProcessor implements ExpressionProcessor {
    private final Validator validator;
    private final Evaluator evaluator;
    private final Function<String, Object> referenceExtractor;

    public PostfixExpressionProcessor(Validator validator) {
        this(validator, null);
    }

    public PostfixExpressionProcessor(
            Validator validator,
            Function<String, Object> referenceExtractor
    ) {
        this.evaluator = new PostfixEvaluator();
        this.validator = validator;
        this.referenceExtractor = referenceExtractor;
    }

    @Override
    public boolean evaluate(String expression) throws InvalidExpressionException {
        return evaluate(expression, null);
    }

    @Override
    public boolean evaluate(String expression, Function<String, Object> refExtractor) throws InvalidExpressionException {
        validator.validateAndStandardize(expression);
        return evaluator.evaluate(expression, referenceExtractor);
    }
}

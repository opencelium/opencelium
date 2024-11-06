package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.ocel.base.Evaluator;
import com.becon.opencelium.backend.ocel.base.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.base.Validator;
import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.exceptions.InvalidSyntaxException;

import java.util.function.Function;

public class PostfixExpressionProcessor implements ExpressionProcessor {
    private final Validator validator;
    private final Evaluator evaluator;

    public PostfixExpressionProcessor(Validator validator) {
        this.evaluator = PostfixEvaluator.getInstance();
        this.validator = validator;
    }

    @Override
    public boolean evaluate(String expression) throws InvalidExpressionException {
        return evaluate(expression, null);
    }

    @Override
    public boolean evaluate(String expression, Function<String, Object> refExtractor) throws InvalidExpressionException {
        try {
            return evaluator.evaluate(
                    validator.validateAndStandardize(expression),
                    refExtractor
            );
        } catch (InvalidSyntaxException e) {
            throw InvalidExpressionException.invalidSyntaxException(e);
        }
    }
}

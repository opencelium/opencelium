package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.Evaluator;
import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.Validator;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.token.Token;
import com.becon.opencelium.backend.ocel.token.TokenType;
import com.becon.opencelium.backend.ocel.token.Tokenizer;
import com.becon.opencelium.backend.reference.ReferenceMatchers;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;
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
        return evaluate(expression, refExtractor, null, null);
    }

    @Override
    public Object evaluate(String expression, Function<String, Object> refExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) {
        return evaluator.evaluate(validator.validateAndTokenize(expression), refExtractor, logger, masking);
    }

    @Override
    public List<String> extractReferences(String expression) {
        List<String> references = new ArrayList<>();
        if (StringUtils.isBlank(expression)) {
            return references;
        }
        try {
            collectReferences(Tokenizer.splitTokens(expression), references);
        } catch (RuntimeException e) {
            // best-effort: a malformed expression yields whatever could be tokenized
        }
        return references;
    }

    private void collectReferences(List<Token> tokens, List<String> references) {
        for (Token token : tokens) {
            if (token.getType() == TokenType.OPERAND) {
                String lexeme = token.getLexeme();
                if (lexeme == null) {
                    continue;
                }
                if (ReferenceMatchers.isWrappedDirect(lexeme)) {
                    references.add(lexeme);
                } else {
                    // direct references embedded inside a larger literal
                    for (int[] loc : PathAndReferenceUtility.extractReferenceIndexes(lexeme)) {
                        references.add(lexeme.substring(loc[0], loc[1]));
                    }
                }
            } else if (token.getType() == TokenType.FUNCTION && token.getFunctionParameters() != null) {
                for (List<Token> parameter : token.getFunctionParameters()) {
                    collectReferences(parameter, references);
                }
            }
        }
    }
}

package com.becon.opencelium.backend.ocel;

import com.becon.opencelium.backend.ocel.token.Token;
import com.becon.opencelium.backend.ocel.token.TokenType;
import com.becon.opencelium.backend.ocel.token.Tokenizer;
import com.becon.opencelium.backend.ocel.operand.OperandUtils;
import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.operator.OperatorUtils;

import java.util.List;

public class Validator {
    private final ShallowEvaluator shallowEvaluator;

    private Validator(ShallowEvaluatorType shallowEvaluatorType) {
        this.shallowEvaluator = ShallowEvaluatorFactory.get(shallowEvaluatorType);
    }

    public static Validator defaultValidator() {
        return new Validator(ShallowEvaluatorType.POSTFIX);
    }

    public static Validator withCustomShallowEvaluator(ShallowEvaluatorType type) {
        return new Validator(type);
    }

    /**
     * Validates and standardizes a given expression by ensuring the following:
     * 1. The expression contains only allowed operands, operators, and parentheses.
     * 2. Operators are applied correctly:
     * 2.1. If an operator is unary, it must be placed on the correct side of the operand (either left or right).
     * 2.2. If an operator is binary, it must be positioned between two correct operands.
     * 2.3. The operator's operands must be applicable for the operation. This check is performed if operands have
     * reachable values (i.e., not references).
     * 3. Parentheses are balanced and used correctly.
     * 4. References within the expression are valid.
     *
     * @param expression the input expression as a {@code String} to validate and standardize
     * @return a standardized {@code String} expression with tokens joined by a single space
     * @throws InvalidExpressionException if the expression is invalid or contains unparsable values
     */
    public List<Token> validateAndTokenize(String expression) throws InvalidExpressionException {
        try {
            List<Token> tokens = Tokenizer.splitTokens(expression);
            firstLevelCheck(tokens);
            secondLevelCheck(tokens);
            return tokens;
        } catch (RuntimeException e) {
            throw InvalidExpressionException.unexpectedException(e);
        }
    }

    public void validate(String expression) throws InvalidExpressionException {
        try {
            List<Token> tokens = Tokenizer.splitTokens(expression);
            firstLevelCheck(tokens);
            secondLevelCheck(tokens);
        } catch (RuntimeException e) {
            throw InvalidExpressionException.unexpectedException(e);
        }
    }

    public boolean isValid(String expression) {
        try {
            validate(expression);
            return true;
        } catch (InvalidExpressionException e) {
            return false;
        }
    }

    /**
     * Checks the syntax validity of the expression represented by tokens.
     * This method performs syntax validation without transforming or evaluating the expression
     * in any intermediate notation (such as Reverse Polish Notation).
     * @param tokens
     */
    private void firstLevelCheck(List<Token> tokens) throws InvalidExpressionException {
        int depth = 0;
        for (int i = 0; i < tokens.size(); i++) {
            Token token = tokens.get(i);
            switch (token.getType()) {
                case OPEN_PARENTHESES -> depth++;
                case CLOSE_PARENTHESES -> {
                    depth--;
                    if (depth < 0) {
                        throw InvalidExpressionException.invalidParentheses();
                    }
                }
                case OPERAND -> {
                    if (!OperandUtils.isOperand(token.getLexeme())) {
                        throw InvalidExpressionException.invalidTokenFound(token.getLexeme());
                    }
                }
                case OPERATOR -> {
                    Operator operator = OperatorUtils.getOperator(token.getLexeme());
                    // Handle unary operators
                    if (operator.getArity() == Arity.UNARY) {
                        if (operator.isLeftSided()) {
                            // Check for sufficient right operand for left-sided unary operators
                            if (hasValidNeighbor(tokens, i, true)) {
                                throw InvalidExpressionException.insufficientOperand(token.getLexeme());
                            }
                        } else {
                            // Check for sufficient left operand for right-sided unary operators
                            if (hasValidNeighbor(tokens, i, false)) {
                                throw InvalidExpressionException.insufficientOperand(token.getLexeme());
                            }
                        }
                    }
                    // Handle binary operators
                    else if (operator.getArity() == Arity.BINARY) {
                        if (!hasValidNeighbor(tokens, i, true) || !hasValidNeighbor(tokens, i, false)) {
                            throw InvalidExpressionException.insufficientOperand(token.getLexeme());
                        }
                    }
                }
            }
        }
        if (depth != 0) {
            throw InvalidExpressionException.invalidParentheses();
        }
    }

    private boolean hasValidNeighbor(List<Token> tokens, int i, boolean right) {
        return right
                ? i < tokens.size() - 1 && (
                tokens.get(i + 1).getType() == TokenType.OPEN_PARENTHESES
                        || tokens.get(i + 1).getType() == TokenType.OPERAND
                        || tokens.get(i + 1).getType() == TokenType.FUNCTION
                        || OperatorUtils.isLeftSidedOperator(tokens.get(i + 1).getLexeme())
        )
                : i > 0 && (
                tokens.get(i - 1).getType() == TokenType.CLOSE_PARENTHESES
                        || tokens.get(i - 1).getType() == TokenType.OPERAND
                        || tokens.get(i - 1).getType() == TokenType.FUNCTION
                        || OperatorUtils.isRightSidedOperator(tokens.get(i - 1).getLexeme())
        );
    }

    /**
     * Attempts to verify that the associations between operators and operands are correct.
     * This validation checks if the operators are applied to the correct operand types wherever possible.
     * If operand values are references, the association cannot be fully verified at this level.
     * @param tokens
     */
    private void secondLevelCheck(List<Token> tokens) throws InvalidExpressionException {
        shallowEvaluator.check(tokens);
    }
}
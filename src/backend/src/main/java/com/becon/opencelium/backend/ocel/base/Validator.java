package com.becon.opencelium.backend.ocel.base;

import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.ShallowEvaluatorType;
import com.becon.opencelium.backend.ocel.exceptions.InvalidSyntaxException;
import com.becon.opencelium.backend.ocel.operators.Operator;
import com.becon.opencelium.backend.ocel.utils.Utils;
import org.apache.commons.lang3.StringUtils;

import java.util.List;
import java.util.Stack;

public class Validator {
    private final ShallowEvaluator shallowEvaluator;

    private Validator(ShallowEvaluatorType shallowEvaluatorType) {
        this.shallowEvaluator = ShallowEvaluatorFactory.get(shallowEvaluatorType);
    }

    public static Validator defaultValidator() {
        return new Validator(ShallowEvaluatorType.POSTFIX);
    }

    public static Validator withCustomEvaluator(ShallowEvaluatorType type) {
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
     * @throws InvalidSyntaxException if the expression is invalid or contains unparsable values
     */
    public String validateAndStandardize(String expression) throws InvalidSyntaxException {
        List<String> tokens;
        try {
            tokens = Utils.splitTokens(expression);
        } catch (Exception e) {
            throw InvalidSyntaxException.unknownException(e.getMessage());
        }
        firstLevelCheck(tokens);
        secondLevelCheck(tokens);
        return StringUtils.joinWith(" ", tokens);
    }

    public void validate(String expression) throws InvalidSyntaxException {
        List<String> tokens;
        try {
            tokens = Utils.splitTokens(expression);
        } catch (Exception e) {
            throw InvalidSyntaxException.unknownException(e.getMessage());
        }
        firstLevelCheck(tokens);
        secondLevelCheck(tokens);
    }

    public boolean isValid(String expression) {
        try {
            validate(expression);
            return true;
        } catch (InvalidSyntaxException e) {
            return false;
        }
    }

    /**
     * Checks the syntax validity of the expression represented by tokens.
     * This method performs syntax validation without transforming or evaluating the expression
     * in any intermediate notation (such as Reverse Polish Notation).
     * @param tokens
     */
    private void firstLevelCheck(List<String> tokens) throws InvalidSyntaxException {
        // every token is valid?
        for (String token : tokens) {
            if (!Utils.isValidToken(token)) {
                throw InvalidSyntaxException.invalidValueFoundException(token);
            }
        }

        // parentheses are valid?
        Stack<String> stack = new Stack<>();
        for (String token : tokens) {
            if (token.equals("(")) {
                stack.push("(");
            } else if (token.equals(")")) {
                if (stack.empty()) {
                    throw InvalidSyntaxException.invalidParentheses();
                }
                stack.pop();
            }
        }
        if (!stack.empty()) {
            throw InvalidSyntaxException.invalidParentheses();
        }

        // every operator has required operand(s)?
        for (int i = 0; i < tokens.size(); i++) {
            String token = tokens.get(i);

            if (Utils.isOperator(token)) {
                Operator operator = Utils.getOperator(token);

                // Handle unary operators
                if (operator.getArity() == Arity.UNARY) {
                    if (operator.isLeftSided()) {
                        // Check for sufficient right operand for left-sided unary operators
                        if (i == tokens.size() - 1 || (!tokens.get(i + 1).equals("(") && !Utils.isOperand(tokens.get(i + 1)))) {
                            throw InvalidSyntaxException.insufficientOperandException(token);
                        }
                    } else {
                        // Check for sufficient left operand for right-sided unary operators
                        if (i == 0 || (!tokens.get(i - 1).equals(")") && !Utils.isOperand(tokens.get(i - 1)))) {
                            throw InvalidSyntaxException.insufficientOperandException(token);
                        }
                    }
                }
                // Handle binary operators
                else if (operator.getArity() == Arity.BINARY) {
                    boolean hasLeftOperand = i > 0 && (tokens.get(i - 1).equals(")") || Utils.isOperand(tokens.get(i - 1)));
                    boolean hasRightOperand = i < tokens.size() - 1 && (tokens.get(i + 1).equals("(") || Utils.isOperand(tokens.get(i + 1)));

                    if (!hasLeftOperand || !hasRightOperand) {
                        throw InvalidSyntaxException.insufficientOperandException(token);
                    }
                }
            }
        }
    }

    /**
     * Attempts to verify that the associations between operators and operands are correct.
     * This validation checks if the operators are applied to the correct operand types wherever possible.
     * If operand values are references, the association cannot be fully verified at this level.
     * @param tokens
     */
    private void secondLevelCheck(List<String> tokens) throws InvalidSyntaxException {
        shallowEvaluator.check(tokens);
    }
}
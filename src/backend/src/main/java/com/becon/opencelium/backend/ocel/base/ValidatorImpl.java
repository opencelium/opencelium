package com.becon.opencelium.backend.ocel.base;

import com.becon.opencelium.backend.ocel.commons.Operand;
import com.becon.opencelium.backend.ocel.commons.Token;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exceptions.InvalidSyntaxException;
import com.becon.opencelium.backend.ocel.exceptions.ValueParseException;
import com.becon.opencelium.backend.ocel.operators.Operator;
import com.becon.opencelium.backend.ocel.postfix.ConverterToIntermediateNotation;
import com.becon.opencelium.backend.ocel.utils.RawValueParser;
import com.becon.opencelium.backend.ocel.utils.Utils;
import org.apache.commons.lang3.StringUtils;

import java.util.List;
import java.util.Queue;
import java.util.Stack;

public class ValidatorImpl implements Validator {
    private static final ValidatorImpl INSTANCE = new ValidatorImpl(); // eager
    private final RawValueParser rawValueParser;
    private final ConverterToIntermediateNotation converterIN;

    private ValidatorImpl() {
        rawValueParser = RawValueParser.getInstance();
        converterIN = ConverterToIntermediateNotation.getInstance();
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
    @Override
    public String validateAndStandardize(String expression) throws InvalidSyntaxException {
        List<String> tokens = Utils.splitTokens(expression);
        firstLevelCheck(tokens);
        secondLevelCheck(tokens);
        return StringUtils.joinWith(" ", tokens);
    }

    /**
     * Checks the syntax validity of the expression represented by tokens.
     * This method performs syntax validation without transforming or evaluating the expression
     * in any intermediate notation (such as Reverse Polish Notation).
     *
     * @param tokens
     */
    private void firstLevelCheck(List<String> tokens) throws InvalidSyntaxException {
        for (String token : tokens) {
            if (!Utils.isValidToken(token)) {
                throw InvalidSyntaxException.invalidValueFoundException(token);
            }
        }

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
    }

    /**
     * Attempts to verify that the associations between operators and operands are correct.
     * This validation checks if the operators are applied to the correct operand types wherever possible.
     * If operand values are references, the association cannot be fully verified at this level.
     *
     * @param tokens
     */
    private void secondLevelCheck(List<String> tokens) throws InvalidSyntaxException {
        Queue<Token> queue = converterIN.intermediateNotation(tokens);
        Stack<Object> operandStack = new Stack<>();

        while (!queue.isEmpty()) {
            Token token = queue.poll();
            if (token instanceof Operator operator) {
                Arity arity = operator.getArity();
                if (arity == Arity.UNARY) {
                    Object pop = operandStack.pop();
                    if (pop instanceof ReferenceOperand) {
                        operandStack.push(ReferenceOperand.dummy);
                    } else if (pop instanceof Operand operand) {
                        if (operand.isRaw()) {
                            String rawValue = operand.getRawValue();
                            try {
                                Object parsed = rawValueParser.parse(rawValue);
                                operandStack.push(Operand.withValue(operator.apply(parsed)));
                            } catch (ValueParseException e) {
                                throw InvalidSyntaxException.valueParseException(e);
                            } catch (ApplyOperatorException e) {
                                throw InvalidSyntaxException.applyOperatorException(e);
                            }
                        }
                    }
                } else if (arity == Arity.BINARY) {
                    Object first = operandStack.pop();
                    Object second = operandStack.pop();
                    if (first instanceof ReferenceOperand || second instanceof ReferenceOperand) {
                        operandStack.push(ReferenceOperand.dummy);
                    } else {
                        Operand left = (Operand) second;
                        Operand right = (Operand) first;
                        if (left.isRaw()) {
                            String rawValue = left.getRawValue();
                            try {
                                Object parsed = rawValueParser.parse(rawValue);
                                left.setValue(parsed);
                            } catch (ValueParseException e) {
                                throw InvalidSyntaxException.valueParseException(e);
                            }
                        }
                        if (right.isRaw()) {
                            String rawValue = right.getRawValue();
                            try {
                                Object parsed = rawValueParser.parse(rawValue);
                                right.setValue(parsed);
                            } catch (ValueParseException e) {
                                throw InvalidSyntaxException.valueParseException(e);
                            }
                        }
                        try {
                            operandStack.push(Operand.withValue(operator.apply(left.getValue(), right.getValue())));
                        } catch (ApplyOperatorException e) {
                            throw InvalidSyntaxException.applyOperatorException(e);
                        }
                    }
                }
            } else if (token instanceof Operand operand) {
                String rawValue = operand.getRawValue();
                if (Utils.isReference(rawValue)) {
                    operandStack.push(ReferenceOperand.dummy);
                } else {
                    operandStack.push(operand);
                }
            }
        }
    }

    private static class ReferenceOperand {

        private ReferenceOperand() {
        }

        static final ReferenceOperand dummy = new ReferenceOperand();

    }

    public static Validator getInstance() {
        return INSTANCE;
    }
}


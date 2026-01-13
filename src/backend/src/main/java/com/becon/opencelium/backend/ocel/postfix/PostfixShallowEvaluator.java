package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.ocel.ShallowEvaluator;
import com.becon.opencelium.backend.ocel.utils.ReferenceUtils;
import com.becon.opencelium.backend.ocel.exception.ApplyFunctionException;
import com.becon.opencelium.backend.ocel.function.FunctionFactory;
import com.becon.opencelium.backend.ocel.operand.Operand;
import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorUtils;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.exception.ValueParseException;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.common.RawValueParser;
import com.becon.opencelium.backend.ocel.token.Token;
import com.becon.opencelium.backend.ocel.token.TokenType;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;

import java.util.*;

public class PostfixShallowEvaluator implements ShallowEvaluator {
    private final PostfixNotationConvertor postfixConverter;
    private final RawValueParser rawValueParser;
    private static final PostfixShallowEvaluator INSTANCE = new PostfixShallowEvaluator();
    private static final ReferenceOperand dummy = ReferenceOperand.dummy;

    private PostfixShallowEvaluator() {
        this.postfixConverter = PostfixNotationConvertor.getInstance();
        this.rawValueParser = RawValueParser.getInstance();
    }

    private void check(Queue<Token> queue) throws InvalidExpressionException {
        Stack<Object> operandStack = new Stack<>();

        try {
            while (!queue.isEmpty()) {
                Token token = queue.poll();
                if (Objects.equals(token.getType(), TokenType.OPERATOR)) {
                    Operator operator = OperatorUtils.getOperator(token.getLexeme());
                    Arity arity = operator.getArity();
                    if (arity == Arity.UNARY) {
                        Object pop = operandStack.pop();
                        if (Objects.equals(pop, dummy)) {
                            operandStack.push(pop);
                        } else if (pop instanceof Operand operand) {
                            Object value = operand.getValue();
                            if (operand.isRaw()) {
                                try {
                                    value = rawValueParser.parse(operand.getRawValue());
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            try {
                                operandStack.push(Operand.withValue(operator.apply(value)));
                            } catch (ApplyOperatorException e) {
                                throw InvalidExpressionException.applyOperatorException(e);
                            }
                        }
                    } else if (arity == Arity.BINARY) {
                        Object second = operandStack.pop();
                        Object first = operandStack.pop();

                        boolean firstIsRef = Objects.equals(first, dummy);
                        boolean secondIsRef = Objects.equals(second, dummy);

                        if (firstIsRef && secondIsRef) {
                            operandStack.push(dummy);
                        } else if (firstIsRef) {
                            Operand operand = (Operand) second;
                            Object value = operand.getValue();
                            if (operand.isRaw()) {
                                try {
                                    value = rawValueParser.parse(operand.getRawValue());
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            if (!operator.isValidOperand(SidesType.RIGHT, value)) {
                                throw InvalidExpressionException.unsupportedOperand(operator.getOperatorType().getName(), operand.getRawValue());
                            }
                            operandStack.push(dummy);
                        } else if (secondIsRef) {
                            Operand operand = (Operand) first;
                            Object value = operand.getValue();
                            if (operand.isRaw()) {
                                try {
                                    value = rawValueParser.parse(operand.getRawValue());
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            if (!operator.isValidOperand(SidesType.LEFT, value)) {
                                throw InvalidExpressionException.unsupportedOperand(operator.getOperatorType().getName(), operand.getRawValue());
                            }
                            operandStack.push(dummy);
                        } else {
                            Operand left = (Operand) second;
                            Operand right = (Operand) first;
                            if (left.isRaw()) {
                                String rawValue = left.getRawValue();
                                try {
                                    Object parsed = rawValueParser.parse(rawValue);
                                    left.setValue(parsed);
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            if (right.isRaw()) {
                                String rawValue = right.getRawValue();
                                try {
                                    Object parsed = rawValueParser.parse(rawValue);
                                    right.setValue(parsed);
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            try {
                                operandStack.push(Operand.withValue(operator.apply(left.getValue(), right.getValue())));
                            } catch (ApplyOperatorException e) {
                                throw InvalidExpressionException.applyOperatorException(e);
                            }
                        }
                    }
                } else if (Objects.equals(token.getType(), TokenType.OPERAND)) {
                    String rawValue = token.getLexeme();
                    if (ReferenceUtils.isReference(rawValue)) {
                        operandStack.push(dummy);
                    } else {
                        List<int[]> ints = PathAndReferenceUtility.extractReferenceIndexes(rawValue);
                        if (!ints.isEmpty()) {
                            operandStack.push(dummy);
                        }
                        operandStack.push(Operand.withRawValue(rawValue));
                    }
                } else if (Objects.equals(token.getType(), TokenType.FUNCTION)) {
                    List<List<Token>> parameters = token.getFunctionParameters();
                    String lexeme = token.getLexeme();
                    Object[] parameterValues = new Object[parameters.size()];
                    for (int i = 0; i < parameters.size(); i++) {
                        List<Token> parameter = parameters.get(i);
                        Queue<Token> postfix = postfixConverter.toPostfix(parameter);
                        check(postfix);
                    }
                    //TODO: check an availability of the function that matches the parameters list.
                    var function = FunctionFactory.function(lexeme, parameterValues);
                    if (Objects.isNull(function)) {
                        throw InvalidExpressionException.functionNotFound(lexeme, parameterValues);
                    }
                    try {
                        operandStack.add(Operand.withValue(function.call(parameterValues)));
                    } catch (ApplyFunctionException e) {
                        throw InvalidExpressionException.applyFunctionException(e);
                    }
                }
            }
        } catch (EmptyStackException e) {
            throw InvalidExpressionException.insufficientOperand();
        }

        if (operandStack.size() != 1) {
            throw InvalidExpressionException.invalidAssociationBetweenOperatorAndOperands();
        }
    }

    @Override
    public void check(List<Token> tokens) throws InvalidExpressionException {
        Queue<Token> queue = postfixConverter.toPostfix(tokens);
        check(queue);
    }

    public static PostfixShallowEvaluator getInstance() {
        return INSTANCE;
    }

    private static class ReferenceOperand {

        private ReferenceOperand() {
        }

        static final ReferenceOperand dummy = new ReferenceOperand();

    }
}

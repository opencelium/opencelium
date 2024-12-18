package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.ocel.ShallowEvaluator;
import com.becon.opencelium.backend.ocel.common.Component;
import com.becon.opencelium.backend.ocel.common.ReferenceUtils;
import com.becon.opencelium.backend.ocel.operand.Operand;
import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.exception.ValueParseException;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.common.RawValueParser;

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

    @Override
    public void check(List<Component> components) throws InvalidExpressionException {
        Queue<Component> queue = postfixConverter.toPostfix(components);
        Stack<Object> operandStack = new Stack<>();

        try {
            while (!queue.isEmpty()) {
                Component component = queue.poll();
                if (component instanceof Operator operator) {
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
                } else if (component instanceof Operand operand) {
                    String rawValue = operand.getRawValue();
                    if (ReferenceUtils.isReference(rawValue)) {
                        operandStack.push(dummy);
                    } else {
                        operandStack.push(operand);
                    }
                }
            }
        } catch (EmptyStackException e) {
            throw InvalidExpressionException.insufficientOperand();
        }

        if (operandStack.size() != 1) {
            throw InvalidExpressionException.invalidAssociationBetweenOperatorAndOperands();
        }

        Object peek = operandStack.peek();
        if (peek instanceof Operand operand) {
            if (!(operand.isRaw() && ("true".equals(operand.getRawValue()) || "false".equals(operand.getRawValue())) || operand.getValue() instanceof Boolean)) {
                throw InvalidExpressionException.resultValueIsNotBoolean(operand.isRaw() ? operand.getRawValue() : operand.getValue());
            }
        }
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

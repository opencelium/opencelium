package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.ocel.commons.Operand;
import com.becon.opencelium.backend.ocel.commons.PostfixNotationConvertor;
import com.becon.opencelium.backend.ocel.commons.Token;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.base.Evaluator;
import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.operators.Operator;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exceptions.ValueParseException;
import com.becon.opencelium.backend.ocel.commons.RawValueParser;
import com.becon.opencelium.backend.ocel.utils.Utils;

import java.util.EmptyStackException;
import java.util.List;
import java.util.Queue;
import java.util.Stack;
import java.util.function.Function;

public class PostfixEvaluator implements Evaluator {

    private static final PostfixEvaluator INSTANCE = new PostfixEvaluator();

    private final PostfixNotationConvertor postfixConverter;
    private final RawValueParser rawValueParser;

    private PostfixEvaluator() {
        this.postfixConverter = PostfixNotationConvertor.getInstance();
        this.rawValueParser = RawValueParser.getInstance();
    }

    @Override
    public boolean evaluate(String expression, Function<String, Object> referenceExtractor) throws InvalidExpressionException {
        try {
            List<String> strings = Utils.splitBySpace(expression);
            Queue<Token> tokens = postfixConverter.toPostfix(strings);
            Stack<Operand> operandStack = new Stack<>();

            try {
                while (!tokens.isEmpty()) {
                    Token token = tokens.poll();
                    if (token instanceof Operator operator) {
                        Arity arity = operator.getArity();
                        if (arity == Arity.UNARY) {
                            Operand operand = operandStack.pop();
                            if (operand.isRaw()) {
                                try {
                                    operand.setValue(getValueOfRaw(operand.getRawValue(), referenceExtractor));
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            Object result;
                            try {
                                result = operator.apply(operand.getValue());
                            } catch (ApplyOperatorException e) {
                                throw InvalidExpressionException.applyOperatorException(e);
                            }
                            operandStack.push(Operand.withValue(result));
                        } else if (arity == Arity.BINARY) {
                            Operand right = operandStack.pop();
                            Operand left = operandStack.pop();

                            if (left.isRaw()) {
                                try {
                                    left.setValue(getValueOfRaw(left.getRawValue(), referenceExtractor));
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            if (right.isRaw()) {
                                try {
                                    right.setValue(getValueOfRaw(right.getRawValue(), referenceExtractor));
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            Object result;
                            try {
                                result = operator.apply(left.getValue(), right.getValue());
                            } catch (ApplyOperatorException e) {
                                throw InvalidExpressionException.applyOperatorException(e);
                            }
                            operandStack.push(Operand.withValue(result));
                        }
                    } else if (token instanceof Operand operand) {
                        operandStack.push(operand);
                    }
                }
            } catch (EmptyStackException e) {
                throw InvalidExpressionException.insufficientOperand();
            }

            if (operandStack.size() != 1) {
                throw InvalidExpressionException.invalidAssociationBetweenOperatorAndOperands();
            }
            Operand peek = operandStack.peek();
            try {
                return peek.isRaw()
                        ? Boolean.parseBoolean(peek.getRawValue())
                        : (Boolean) peek.getValue();
            } catch (Exception e) {
                throw InvalidExpressionException.resultValueIsNotBoolean(peek.isRaw() ? peek.getRawValue() : peek.getValue());
            }
        } catch (RuntimeException e) {
            throw InvalidExpressionException.unexpectedException(e);
        }
    }

    private Object getValueOfRaw(String rawValue, Function<String, Object> referenceExtractor) throws ValueParseException, InvalidExpressionException {
        if (Utils.isReference(rawValue)) {
            if (referenceExtractor == null)
                throw InvalidExpressionException.referenceExtractorNotFound(rawValue);
            try {
                return referenceExtractor.apply(rawValue);
            } catch (RuntimeException e) {
                throw InvalidExpressionException.cannotExtractReferenceValue(rawValue, e);
            }
        }
        return rawValueParser.parse(rawValue);
    }

    public static PostfixEvaluator getInstance() {
        return INSTANCE;
    }
}

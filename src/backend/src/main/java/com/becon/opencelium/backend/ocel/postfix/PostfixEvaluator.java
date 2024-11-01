package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.ocel.commons.Operand;
import com.becon.opencelium.backend.ocel.commons.Token;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.base.Evaluator;
import com.becon.opencelium.backend.ocel.exceptions.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.operators.Operator;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exceptions.ValueParseException;
import com.becon.opencelium.backend.ocel.utils.RawValueParser;
import com.becon.opencelium.backend.ocel.utils.Utils;

import java.util.Queue;
import java.util.Stack;
import java.util.function.Function;

public class PostfixEvaluator implements Evaluator {

    private static final PostfixEvaluator INSTANCE = new PostfixEvaluator();

    private final ConverterToIntermediateNotation converterIN;
    private final RawValueParser rawValueParser;

    private PostfixEvaluator() {
        this.converterIN = ConverterToIntermediateNotation.getInstance();
        this.rawValueParser = RawValueParser.getInstance();
    }

    @Override
    public boolean evaluate(String expression, Function<String, Object> referenceExtractor) throws InvalidExpressionException {
        Queue<Token> tokens = converterIN.convert(expression);
        return evaluateInternal(tokens, referenceExtractor);
    }

    private boolean evaluateInternal(Queue<Token> tokens, Function<String, Object> referenceExtractor) throws InvalidExpressionException {
        Stack<Operand> operandStack = new Stack<>();
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
        return operandStack.peek().isRaw()
                ? Boolean.parseBoolean(operandStack.peek().getRawValue())
                : (Boolean) operandStack.peek().getValue();
    }

    private Object getValueOfRaw(String rawValue, Function<String, Object> referenceExtractor) throws ValueParseException {
        return Utils.isReference(rawValue)
                ? referenceExtractor.apply(rawValue)
                : rawValueParser.parse(rawValue);
    }

    public static Evaluator getInstance() {
        return INSTANCE;
    }
}

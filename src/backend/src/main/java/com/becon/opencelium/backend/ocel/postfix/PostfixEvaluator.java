package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.utils.ReferenceUtils;
import com.becon.opencelium.backend.ocel.exception.ApplyFunctionException;
import com.becon.opencelium.backend.ocel.function.FunctionFactory;
import com.becon.opencelium.backend.ocel.operand.Operand;
import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.Evaluator;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exception.ValueParseException;
import com.becon.opencelium.backend.ocel.common.RawValueParser;
import com.becon.opencelium.backend.ocel.operator.OperatorUtils;
import com.becon.opencelium.backend.ocel.token.Token;
import com.becon.opencelium.backend.ocel.token.TokenType;

import java.util.*;
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
    public Object evaluate(List<Token> tokens, Function<String, Object> referenceExtractor) throws InvalidExpressionException {
        return evaluate(tokens, referenceExtractor, null, null);
    }

    @Override
    public Object evaluate(List<Token> tokens, Function<String, Object> referenceExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) {
        try {
            Queue<Token> tokenQueue = postfixConverter.toPostfix(tokens);
            Stack<Operand> operandStack = new Stack<>();

            try {
                while (!tokenQueue.isEmpty()) {
                    Token token = tokenQueue.poll();
                    if (Objects.equals(token.getType(), TokenType.OPERATOR)) {
                        Operator operator = OperatorUtils.getOperator(token.getLexeme());
                        Arity arity = operator.getArity();
                        if (arity == Arity.UNARY) {
                            Operand operand = operandStack.pop();
                            if (operand.isRaw()) {
                                try {
                                    operand.setValue(getValueOfRaw(operand.getRawValue(), referenceExtractor, logger, masking));
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
                                    left.setValue(getValueOfRaw(left.getRawValue(), referenceExtractor, logger, masking));
                                } catch (ValueParseException e) {
                                    throw InvalidExpressionException.valueParseException(e);
                                }
                            }
                            if (right.isRaw()) {
                                try {
                                    right.setValue(getValueOfRaw(right.getRawValue(), referenceExtractor, logger, masking));
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
                    } else if (Objects.equals(token.getType(), TokenType.OPERAND)) {
                        operandStack.push(Operand.withRawValue(token.getLexeme()));
                    } else if (Objects.equals(token.getType(), TokenType.FUNCTION)) {
                        List<List<Token>> parameters = token.getFunctionParameters();
                        String lexeme = token.getLexeme();
                        Object[] parameterValues = new Object[parameters.size()];
                        for (int i = 0; i < parameters.size(); i++) {
                            List<Token> parameter = parameters.get(i);
                            parameterValues[i] = evaluate(parameter, referenceExtractor, logger, masking);
                        }
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
            Operand last = operandStack.pop();
            if (last.isRaw()) {
                try {
                    return rawValueParser.parse(last.getRawValue());
                } catch (ValueParseException e) {
                    throw InvalidExpressionException.valueParseException(e);
                }
            }
            return last.getValue();
        } catch (InvalidExpressionException e) {
            throw e;
        } catch (Exception e) {
            throw InvalidExpressionException.unexpectedException(e);
        }
    }

    private Object getValueOfRaw(String rawValue, Function<String, Object> referenceExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) throws ValueParseException, InvalidExpressionException {
        if (ReferenceUtils.isReference(rawValue)) {
            if (referenceExtractor == null)
                throw InvalidExpressionException.referenceExtractorNotFound(rawValue);

            Object result = referenceExtractor.apply(rawValue);
            if (Objects.nonNull(logger) && Objects.nonNull(masking)) {
                String maskedResult = masking.applyMask(result, rawValue);
                logger.logAndSend(String.format("segment=IF_REF ref='%s' data=%s", rawValue, maskedResult));
            }

            return result;
        }
        return rawValueParser.parse(rawValue);
    }

    public static PostfixEvaluator getInstance() {
        return INSTANCE;
    }
}

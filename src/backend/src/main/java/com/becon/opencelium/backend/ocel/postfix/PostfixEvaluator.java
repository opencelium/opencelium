package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.ast.*;
import com.becon.opencelium.backend.ocel.exception.*;
import com.becon.opencelium.backend.ocel.function.FunctionFactory;
import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.Evaluator;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.operator.OperatorUtils;
import com.becon.opencelium.backend.ocel.token.Token;
import com.becon.opencelium.backend.ocel.token.TokenType;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;

import java.util.*;
import java.util.function.Function;

public class PostfixEvaluator implements Evaluator {

    private static final PostfixEvaluator INSTANCE = new PostfixEvaluator();

    private final PostfixNotationConvertor postfixConverter;

    private PostfixEvaluator() {
        this.postfixConverter = PostfixNotationConvertor.getInstance();
    }

    @Override
    public Object evaluate(List<Token> tokens, Function<String, Object> referenceExtractor) throws InvalidExpressionException {
        return evaluate(tokens, referenceExtractor, null, null);
    }

    @Override
    public Object evaluate(List<Token> tokens, Function<String, Object> referenceExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) {
        try {
            Queue<Token> tokenQueue = postfixConverter.toPostfix(tokens);
            Stack<ASTNode> nodeStack = new Stack<>();

            while (!tokenQueue.isEmpty()) {
                Token token = tokenQueue.poll();

                if (token.getType() == TokenType.OPERATOR) {
                    Operator operator = OperatorUtils.getOperator(token.getLexeme());
                    Arity arity = operator.getArity();

                    if (arity == Arity.UNARY) {
                        ASTNode operandNode = nodeStack.pop();
                        nodeStack.push(new UnaryOpNode(operator, operandNode));
                    } else if (arity == Arity.BINARY) {
                        ASTNode rightNode = nodeStack.pop();
                        ASTNode leftNode = nodeStack.pop();
                        nodeStack.push(new BinaryOpNode(operator, leftNode, rightNode));
                    }
                } else if (token.getType() == TokenType.OPERAND) {
                    nodeStack.push(new ValueNode(token.getLexeme()));
                } else if (token.getType() == TokenType.FUNCTION) {
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
                        nodeStack.add(new ValueNode(function.call(parameterValues)));
                    } catch (ApplyFunctionException e) {
                        throw InvalidExpressionException.applyFunctionException(e);
                    }
                }
            }

            if (nodeStack.size() != 1) {
                throw InvalidExpressionException.invalidAssociationBetweenOperatorAndOperands();
            }

            ASTNode rootNode = nodeStack.pop();
            try {
                return rootNode.eval(referenceExtractor, logger, masking);
            } catch (InvalidExpressionException e) {
                throw new RuntimeException(e);
            } catch (ApplyOperatorException e) {
                throw InvalidExpressionException.applyOperatorException(e);
            } catch (ValueParseException e) {
                throw InvalidExpressionException.valueParseException(e);
            } catch (ExceptionWrapper e) {
                if (e.getOriginalException() instanceof InvalidExpressionException) {
                    throw e;
                }
                if (e.getOriginalException() instanceof ValueParseException vpe) {
                    throw InvalidExpressionException.valueParseException(vpe);
                }
                if (e.getOriginalException() instanceof ApplyOperatorException aoe) {
                    throw InvalidExpressionException.applyOperatorException(aoe);
                }
                throw e.getOriginalException();
            }

        } catch (Exception e) {
            throw InvalidExpressionException.unexpectedException(e);
        }
    }

    private Object getValueOfRaw(String rawValue, Function<String, Object> referenceExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) throws ValueParseException, InvalidExpressionException {
        if (ReferenceUtils.isReference(rawValue)) {
            if (referenceExtractor == null)
                throw InvalidExpressionException.referenceExtractorNotFound(rawValue);

            Object result = referenceExtractor.apply(rawValue);
            logResult(result, rawValue, logger, masking);

            return result;
        }

        List<int[]> locs = PathAndReferenceUtility.extractReferenceIndexes(rawValue);

        if (locs.isEmpty()) {
            return rawValueParser.parse(rawValue);
        }

        if (referenceExtractor == null) {
            throw InvalidExpressionException.referenceExtractorNotFound(rawValue);
        }

        StringBuilder out = new StringBuilder(rawValue.length());
        int pos = 0;

        for (int[] loc : locs) {
            int start = loc[0], end = loc[1];

            out.append(rawValue, pos, start);

            String ref = rawValue.substring(start, end);
            Object result = referenceExtractor.apply(ref);
            logResult(result, ref, logger, masking);

            String stringResult = ValueUtils.serializeValue(result);
            out.append(stringResult);
            pos = end;
        }

        out.append(rawValue, pos, rawValue.length());

        if(out.charAt(0) == '"' && out.charAt(out.length() - 1) == '"') {
            out.deleteCharAt(0);
            out.deleteCharAt(out.length() - 1);
        }
        return out.toString();
    }

    private void logResult(Object result,String ref, OcLogger<ExecutionLog> logger, MaskingService masking){
        if (logger != null && masking != null) {
            String maskedResult = masking.applyMask(result, ref);
            logger.logAndSend("segment=IF_REF ref=(%s) data=%s".formatted(ref, maskedResult));
        }
    }

    public static PostfixEvaluator getInstance() {
        return INSTANCE;
    }
}

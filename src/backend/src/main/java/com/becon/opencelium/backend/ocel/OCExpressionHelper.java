package com.becon.opencelium.backend.ocel;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.ocel.exception.ErrorCode;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.operand.OperandUtils;
import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.OperatorFactory;
import com.becon.opencelium.backend.ocel.token.Token;
import com.becon.opencelium.backend.ocel.token.TokenType;
import com.becon.opencelium.backend.ocel.token.Tokenizer;
import com.becon.opencelium.backend.ocel.utils.ReferenceUtils;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;
import io.micrometer.common.util.StringUtils;

import java.util.List;
import java.util.Objects;

public class OCExpressionHelper {
    public static String buildExp(ConditionMng condition) {
        StatementMng leftStatement = condition.getLeftStatement();
        StatementMng rightStatement = condition.getRightStatement();
        String op = condition.getRelationalOperator();

        if (StringUtils.isBlank(op)) {
            op = "for";
        }

        OperatorEnum operatorEnum = OperatorEnum.fromName(op);

        if (Objects.isNull(operatorEnum)) {
            return null;
        }

        if (operatorEnum == OperatorEnum.FOR || operatorEnum == OperatorEnum.FOR_IN) {
            return operatorEnum.getName() + " " + buildOperand(leftStatement, rightStatement.getRightPropertyValue());
        }

        if (operatorEnum == OperatorEnum.SPLIT_STRING) {
            return buildOperand(leftStatement, rightStatement.getRightPropertyValue()) + " " + operatorEnum.getName() + " " + buildOperand(rightStatement);
        }

        Operator operator = OperatorFactory.getOperator(operatorEnum);
        if (operator == null) {
            return null;
        }
        if (operator.getArity() == Arity.UNARY) {
            if (operator.isLeftSided()) {
                return operatorEnum.getName() + " " + buildOperand(rightStatement);
            } else {
                return buildOperand(leftStatement, rightStatement.getRightPropertyValue()) + " " + operatorEnum.getName();
            }
        } else {
            if (operatorEnum == OperatorEnum.IS_TYPE_OF) {
                return buildOperand(leftStatement, rightStatement.getRightPropertyValue()) + " " + operatorEnum.getName() + " " + buildOperand(rightStatement, false);
            }
            return buildOperand(leftStatement, rightStatement.getRightPropertyValue()) + " " + operatorEnum.getName() + " " + buildOperand(rightStatement);
        }
    }

    public static void validateLoopExp(String exp) {
        List<Token> tokens = Tokenizer.splitTokens(exp);
        if (tokens.size() == 2) {
            // FOR and FOR_IN
            if (tokens.get(0).getType() == TokenType.OPERATOR && tokens.get(1).getType() == TokenType.OPERAND) {
                OperatorEnum operatorEnum = OperatorEnum.fromName(tokens.get(0).getLexeme());
                if (!(operatorEnum == OperatorEnum.FOR || operatorEnum == OperatorEnum.FOR_IN)) {
                    if (ReferenceUtils.isReference(tokens.get(1).getLexeme()) || ValueUtils.isArray(tokens.get(1).getLexeme())) {
                        throw new InvalidExpressionException(
                                ErrorCode.INVALID_LOOP_TYPE,
                                "Loop type is incorrect. Did you mean 'for %s'?".formatted(tokens.get(1).getLexeme())
                        );
                    }
                    throw InvalidExpressionException.invalidLoopExpression(exp);
                }
            } else {
                throw InvalidExpressionException.invalidLoopExpression(exp);
            }
        } else if (tokens.size() == 3) {
            // SPLIT_STRING
            OperatorEnum operatorEnum = OperatorEnum.fromName(tokens.get(1).getLexeme());
            if (operatorEnum != OperatorEnum.SPLIT_STRING) {
                if ((ReferenceUtils.isReference(tokens.get(0).getLexeme()) || ValueUtils.isString(tokens.get(0).getLexeme()))
                        && (ReferenceUtils.isReference(tokens.get(2).getLexeme()) || ValueUtils.isString(tokens.get(2).getLexeme()))) {
                    throw new InvalidExpressionException(
                            ErrorCode.INVALID_LOOP_TYPE,
                            "Loop type is incorrect. Did you mean '%s SplitString %s'?".formatted(tokens.get(0).getLexeme(), tokens.get(2).getLexeme())
                    );
                }
                throw InvalidExpressionException.invalidLoopExpression(exp);
            } else {
                if (!(ReferenceUtils.isReference(tokens.get(0).getLexeme()) || ValueUtils.isString(tokens.get(0).getLexeme()))) {
                    throw new InvalidExpressionException(
                            ErrorCode.INVALID_TOKEN_FOUND,
                            "'%s' is not valid left operand for SplitString".formatted(tokens.get(0).getLexeme())
                    );
                }
                if (!(ReferenceUtils.isReference(tokens.get(2).getLexeme()) || ValueUtils.isString(tokens.get(2).getLexeme()))) {
                    throw new InvalidExpressionException(
                            ErrorCode.INVALID_TOKEN_FOUND,
                            "'%s' is not valid right operand for SplitString".formatted(tokens.get(2).getLexeme())
                    );
                }
            }
        } else {
            throw InvalidExpressionException.invalidLoopExpression(exp);
        }
    }

    private static String buildOperand(StatementMng statement, String rightPropertyValue) {
        return buildOperand(statement, false, rightPropertyValue);
    }

    private static String buildOperand(StatementMng statement, boolean quoted, String rpv) {
        if (Objects.isNull(statement)) return "";
        if (StringUtils.isBlank(statement.getType()) && StringUtils.isBlank(statement.getColor())) {
            if (!quoted) return statement.getField();
            return "'" + statement.getField() + "'";
        } else {
            return "{%" + PathAndReferenceUtility.rebuildReference(statement.getColor(), statement.getType(), statement.getField()) + (StringUtils.isBlank(rpv) ? "" : "." + rpv) + "%}";
        }
    }

    private static String buildOperand(StatementMng statement, boolean quoted) {
        return buildOperand(statement, quoted, "");
    }

    private static String buildOperand(StatementMng statement) {
        return buildOperand(statement, true, "");
    }
}

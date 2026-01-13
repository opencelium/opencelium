package com.becon.opencelium.backend.ocel.ast;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exception.ExceptionWrapper;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.exception.ValueParseException;
import com.becon.opencelium.backend.ocel.operator.BoolOperator;
import com.becon.opencelium.backend.ocel.operator.Operator;

import java.util.function.Function;

public class BinaryOpNode implements ASTNode {
    private final Operator operator;
    private final ASTNode leftOperand;
    private final ASTNode rightOperand;

    public BinaryOpNode(Operator operator, ASTNode leftOperand, ASTNode rightOperand) {
        this.operator = operator;
        this.leftOperand = leftOperand;
        this.rightOperand = rightOperand;
    }

    @Override
    public Object eval(Function<String, Object> referenceExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) throws InvalidExpressionException, ApplyOperatorException, ValueParseException {
        if (operator instanceof BoolOperator boolOperator) {
            return boolOperator.apply(
                    () -> {
                        try {
                            return (Boolean) leftOperand.eval(referenceExtractor, logger, masking);
                            //TODO: handle ClassCastException
                        } catch (Exception e) {
                            throw new ExceptionWrapper(e);
                        }
                    },
                    () -> {
                        try {
                            return (Boolean) rightOperand.eval(referenceExtractor, logger, masking);
                            //TODO: handle ClassCastException
                        } catch (Exception e) {
                            throw new ExceptionWrapper(e);
                        }
                    }
            );
        }

        Object leftValue = leftOperand.eval(referenceExtractor, logger, masking);
        Object rightValue = rightOperand.eval(referenceExtractor, logger, masking);
        return operator.apply(leftValue, rightValue);
    }
}

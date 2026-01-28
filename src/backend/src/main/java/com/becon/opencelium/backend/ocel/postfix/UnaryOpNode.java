package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.exception.ValueParseException;
import com.becon.opencelium.backend.ocel.operator.Operator;

import java.util.function.Function;

class UnaryOpNode implements ASTNode {
    private final Operator operator;
    private final ASTNode operand;

    public UnaryOpNode(Operator operator, ASTNode operand) {
        this.operator = operator;
        this.operand = operand;
    }

    @Override
    public Object eval(Function<String, Object> referenceExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) throws InvalidExpressionException, ApplyOperatorException, ValueParseException {
        Object operandValue = operand.eval(referenceExtractor, logger, masking); // Recursively evaluate operand
        return operator.apply(operandValue); // Apply operator to operand value
    }
}

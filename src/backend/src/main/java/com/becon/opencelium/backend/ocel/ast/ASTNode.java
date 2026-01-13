package com.becon.opencelium.backend.ocel.ast;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.exception.ValueParseException;

import java.util.function.Function;

public interface ASTNode {
    Object eval(Function<String, Object> refExtractor, OcLogger<ExecutionLog> logger, MaskingService masking)
            throws InvalidExpressionException, ApplyOperatorException, ValueParseException;
}

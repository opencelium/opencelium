package com.becon.opencelium.backend.ocel;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.token.Token;

import java.util.List;
import java.util.function.Function;

public interface Evaluator {
    Object evaluate(List<Token> tokens, Function<String, Object> referenceExtractor);
    Object evaluate(List<Token> tokens, Function<String, Object> refExtractor, OcLogger<ExecutionLog> logger, MaskingService masking);
}
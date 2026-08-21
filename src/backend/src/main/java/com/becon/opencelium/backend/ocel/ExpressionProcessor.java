package com.becon.opencelium.backend.ocel;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;

import java.util.List;
import java.util.function.Function;

public interface ExpressionProcessor {
    Object evaluate(String expression) throws InvalidExpressionException;
    Object evaluate(String expression, Function<String, Object> refExtractor) throws InvalidExpressionException;
    Object evaluate(String expression, Function<String, Object> refExtractor, OcLogger<ExecutionLog> logger, MaskingService masking);

    /**
     * Extracts the raw reference lexemes an expression consumes — wrapped direct references
     * ({@code {%#color.(response)...%}}), enhancement references, webhook and request-data
     * references, and direct references embedded inside literals — by tokenizing the expression the
     * same way it is evaluated. Callers interpret each reference (e.g. resolve its color) via the
     * reference package. Best-effort: a malformed expression yields whatever could be tokenized.
     */
    List<String> extractReferences(String expression);
}

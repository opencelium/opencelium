package com.becon.opencelium.backend.ocel.ast;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.common.RawValueParser;
import com.becon.opencelium.backend.ocel.exception.ErrorCode;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.exception.ValueParseException;
import com.becon.opencelium.backend.ocel.utils.ReferenceUtils;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

public class ValueNode implements ASTNode {

    private final String value;
    private final Object readyValue;
    private final boolean ready;

    private static final RawValueParser valueParser = RawValueParser.getInstance();

    public ValueNode(String value) {
        this.value = value;
        this.ready = false;
        this.readyValue = null;
    }

    public ValueNode(Object value) {
        this.readyValue = value;
        this.ready = true;
        this.value = null;
    }

    @Override
    public Object eval(Function<String, Object> refExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) throws ValueParseException {
        if (ready) {
            return readyValue;
        }

        if (ReferenceUtils.isReference(value)) {
            if (refExtractor == null)
                throw InvalidExpressionException.referenceExtractorNotFound(value);

            Object result = refExtractor.apply(value);
            if (Objects.nonNull(logger) && Objects.nonNull(masking)) {
                String maskedResult = masking.applyMask(result, value);
                logger.logAndSend(String.format("segment=IF_REF ref=(%s) data=%s", value, maskedResult));
            }

            return result;
        }

        List<int[]> locs = PathAndReferenceUtility.extractReferenceIndexes(value);

        if (locs.isEmpty()) {
            return valueParser.parse(value);
        }

        if (refExtractor == null) {
            throw InvalidExpressionException.referenceExtractorNotFound(value);
        }

        StringBuilder out = new StringBuilder(value.length());
        int pos = 0;

        for (int[] loc : locs) {
            int start = loc[0], end = loc[1];

            out.append(value, pos, start);

            String ref = value.substring(start, end);
            Object result = refExtractor.apply(ref);

            if (result instanceof Collection<?>) {
                throw new InvalidExpressionException(
                        ErrorCode.INVALID_OPERAND_PART,
                        "REFERENCE[%s] returned a non-string value inside OPERAND[%s]".formatted(ref, value)
                );
            }

            if (logger != null && masking != null) {
                String maskedResult = masking.applyMask(result, ref);
                logger.logAndSend("segment=IF_REF ref=(%s) data=%s".formatted(ref, maskedResult));
            }

            out.append(result);
            pos = end;
        }

        out.append(value, pos, value.length());
        return out.toString();
    }
}

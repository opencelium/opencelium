package com.becon.opencelium.backend.ocel.postfix;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.ocel.exception.ValueParseException;
import com.becon.opencelium.backend.ocel.utils.RawValueParser;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;
import com.becon.opencelium.backend.reference.ReferenceMatchers;
import com.becon.opencelium.backend.reference.enums.ReferenceGroup;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;

import java.util.List;
import java.util.function.Function;

class ValueNode implements ASTNode {

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

        return getValueOfRaw(value, refExtractor, logger, masking);
    }

    private Object getValueOfRaw(String rawValue, Function<String, Object> referenceExtractor, OcLogger<ExecutionLog> logger, MaskingService masking) throws ValueParseException, InvalidExpressionException {
        if (ReferenceMatchers.isReference(rawValue, ReferenceGroup.WRAPPED)) {
            if (referenceExtractor == null)
                throw InvalidExpressionException.referenceExtractorNotFound(rawValue);

            Object result = referenceExtractor.apply(rawValue);
            logResult(result, rawValue, logger, masking);

            return result;
        }

        List<int[]> locs = PathAndReferenceUtility.extractReferenceIndexes(rawValue);

        if (locs.isEmpty()) {
            return valueParser.parse(rawValue);
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

        if(out.charAt(0) == '\"' && out.charAt(out.length() - 1) == '\"') {
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
}

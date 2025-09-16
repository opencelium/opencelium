package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.database.mongodb.entity.LogDataError;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.dto.ErrorDetail;
import com.becon.opencelium.backend.execution.logger.enums.*;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.bson.types.ObjectId;

import java.util.*;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.execution.logger.keys.LogLineKey.DATA;

public class OperationLogDataBuilder implements PhaseBuilder {

    public LogData build(PhaseContext phaseCtx, String execId, String flowId, Long connId) {
        ParsedLogLine parsed = phaseCtx.getParsedLogLine();
        PhaseCategory category = PhaseCategory.fromValue((PhaseType) parsed.getStage());

        // 1) Instantiate and populate core LogData fields
        LogData logData = new LogData();
        logData.setId(new ObjectId().toHexString());
        logData.setExecutionId(execId);
        logData.setConnectionId(connId);
        logData.setFlowId(flowId);
        logData.setIndexPath(phaseCtx.getProperty(LogLineKey.INDEX_PATH));
        logData.setStatus(phaseCtx.getStatus());
        logData.setStartOffset(parsed.getStartOffset());
        logData.setEndOffset(phaseCtx.getEndOffset());
        logData.setLogLineType(LogLineType.PHASE);
        logData.setType(category);

        // 2) Extract flat properties
        Map<String, Object> flatProps = extractFlatProperties(phaseCtx.getProperties());
        logData.setProperties(flatProps);

        // 3) Build request/response/error maps
        SegmentAggregate agg = buildSegments(phaseCtx.getSegments());

        // 4) Assemble segment object
        Map<String, Object> segment = new LinkedHashMap<>();
        if (!agg.request.isEmpty())  segment.put("request",  agg.request);
        if (!agg.response.isEmpty()) segment.put("response", agg.response);
        logData.setSegments(segment);

        // 5) If we saw an exception, attach error details
        ErrorDetail errorDetail = phaseCtx.getErrorDetail();
        if (phaseCtx.getErrorDetail() != null) {
            logData.setError(mapCtxError(errorDetail));
        }
        return logData;
    }

    private LogDataError mapCtxError(ErrorDetail errorDetail) {
        LogDataError error = new LogDataError();
        error.setMessage(errorDetail.getException().getProperty(DATA));
        error.setErrorOfOriginPath(errorDetail.getErrorOriginPath());
        error.setStackTrace(errorDetail.getStackTrace());
        return error;
    }

    private Map<String, Object> extractFlatProperties(Map<LogLineKey, String> props) {
        if (props == null || props.isEmpty()) {
            return Collections.emptyMap();
        }
        return props.entrySet().stream()
                .filter(e -> isBaseKey(e.getKey()))
                .collect(Collectors.toMap(
                        e -> e.getKey().getSrcName(),    // use the enum name as the String key
                        Map.Entry::getValue,       // the original String value
                        (a, b) -> b,               // on duplicate key, keep the latter
                        LinkedHashMap::new         // preserve insertion order
                ));
    }

    private boolean isBaseKey(LogLineKey key) {
        String name = key.name();
        return !name.startsWith("HTTP_")
                && key != LogLineKey.URL
                && key != LogLineKey.DATA
                && key != LogLineKey.DURATION
                && key != LogLineKey.FLOWCHART_ID
                && key != LogLineKey.CONNECTOR_NAME
                && key != LogLineKey.EXECUTION_ID
                && key != LogLineKey.CONNECTION_ID
                && key != LogLineKey.INDEX_PATH
                && key != LogLineKey.HTTP_STATUS;
    }

    public LogDataError parseErrorInfo(String data) {
        if (data == null || data.isBlank()) {
            return new LogDataError("", Collections.emptyList());
        }

        String[] lines = data.split("\\R"); // Split on any line break
        String message = lines[0];

        List<String> stackTrace = new ArrayList<>();
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].strip();
            if (!line.isEmpty()) {
                stackTrace.add(line);
            }
        }

        return new LogDataError(message, stackTrace);
    }

    private SegmentAggregate buildSegments(List<SegmentContext> segments) {
        SegmentAggregate agg = new SegmentAggregate();
        for (SegmentContext ctx : segments) {
            Map<LogLineKey,String> p = ctx.getAllProperties();
            switch (ctx.getSegmentType()) {
                case REQUEST -> {
                    agg.request.put(LogLineKey.URL.getSrcName(),    p.get(LogLineKey.URL));
                    agg.request.put(LogLineKey.HTTP_METHOD.getSrcName(), p.get(LogLineKey.HTTP_METHOD));
                }
                case REQUEST_HEADER    -> agg.request.put("header",  p.get(LogLineKey.DATA));
                case REQUEST_PAYLOAD   -> agg.request.put("payload", p.get(LogLineKey.DATA));
                case RESPONSE          -> {
                    agg.response.put(LogLineKey.HTTP_STATUS.getSrcName(),   p.get(LogLineKey.HTTP_STATUS));
                    agg.response.put(LogLineKey.DURATION.getSrcName(), p.get(LogLineKey.DURATION));
                }
                case RESPONSE_HEADER   -> agg.response.put("header",  p.get(LogLineKey.DATA));
                case RESPONSE_PAYLOAD  -> agg.response.put("payload", p.get(LogLineKey.DATA));
                default -> {}
            }
        }
        return agg;
    }

    /**
     * Helper to accumulate segment data in one place.
     */
    private static class SegmentAggregate {
        final Map<String, Object> request  = new LinkedHashMap<>();
        final Map<String, Object> response = new LinkedHashMap<>();
    }
}

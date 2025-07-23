package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.database.mongodb.entity.LogDataError;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.enums.*;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.*;
import java.util.stream.Collectors;

public class OperationLogDataBuilder implements PhaseBuilder {

    public LogData build(PhaseContext phaseCtx, String execId, Long connId) {
        ParsedLogLine parsed = phaseCtx.getParsedLogLine();
        PhaseCategory category = PhaseCategory.fromValue((PhaseType) parsed.getStage());
        long offset = parsed.getOffset();

        // 1) Instantiate and populate core LogData fields
        LogData logData = new LogData();
        logData.setId(UUID.randomUUID().toString());
        logData.setExecutionId(execId);
        logData.setConnectionId(connId);
        logData.setConnectorName(phaseCtx.getProperty(LogLineKey.CONNECTOR_NAME));
        logData.setFlowId(phaseCtx.getProperty(LogLineKey.FLOWCHART_ID));
        logData.setIndexPath(phaseCtx.getProperty(LogLineKey.INDEX_PATH));
        logData.setStatus(phaseCtx.getStatus());
        logData.setStartOffset(offset);
        logData.setEndOffset(offset);
        logData.setLogLineType(LogLineType.PHASE);
        logData.setType(category);

        // 2) Extract flat properties
        Map<LogLineKey, Object> flatProps = extractFlatProperties(phaseCtx.getProperties());
        logData.setProperties(flatProps);

        // 3) Build request/response/error maps
        SegmentAggregate agg = buildSegments(phaseCtx.getSegments());

        // 4) Assemble segment object
        Map<String, Object> segment = new LinkedHashMap<>();
        if (!agg.request.isEmpty())  segment.put("request",  agg.request);
        if (!agg.response.isEmpty()) segment.put("response", agg.response);
        logData.setSegments(segment);

        // 5) If we saw an exception, attach error details
        logData.setError(agg.error);

        return logData;
    }

    private EnumMap<LogLineKey, Object> extractFlatProperties(Map<LogLineKey, String> props) {
        return props.entrySet().stream()
                .filter(e -> isBaseKey(e.getKey()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> b,
                        () -> new EnumMap<>(LogLineKey.class)
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
                    agg.request.put("url",    p.get(LogLineKey.URL));
                    agg.request.put("http_method", p.get(LogLineKey.HTTP_METHOD));
                }
                case REQUEST_HEADER    -> agg.request.put("header",  p.get(LogLineKey.DATA));
                case REQUEST_PAYLOAD   -> agg.request.put("payload", p.get(LogLineKey.DATA));
                case RESPONSE          -> {
                    agg.response.put("status",   p.get(LogLineKey.HTTP_STATUS));
                    agg.response.put("duration", p.get(LogLineKey.DURATION));
                }
                case RESPONSE_HEADER   -> agg.response.put("header",  p.get(LogLineKey.DATA));
                case RESPONSE_PAYLOAD  -> agg.response.put("payload", p.get(LogLineKey.DATA));
                case EXCEPTION         -> {
                    String ex = p.getOrDefault(LogLineKey.DATA,    "");
                    LogDataError error = parseErrorInfo(ex);
                    agg.error.setMessage(error.getMessage());
                    agg.error.setStackTrace(error.getStackTrace());
                }
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
        final LogDataError error    = new LogDataError();
    }
}

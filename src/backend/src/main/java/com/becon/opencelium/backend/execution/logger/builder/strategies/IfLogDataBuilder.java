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

public class IfLogDataBuilder implements PhaseBuilder {

    @Override
    public LogData build(PhaseContext phaseCtx, String execId, Long connId) {
        ParsedLogLine parsed = phaseCtx.getParsedLogLine();
        PhaseCategory category = PhaseCategory.fromValue((PhaseType) parsed.getStage());
        long offset = parsed.getOffset();

        // 1) Core LogData
        LogData logData = new LogData();
        logData.setId(UUID.randomUUID().toString());
        logData.setExecutionId(execId);
        logData.setConnectionId(connId);
        logData.setFlowId(phaseCtx.getProperty(LogLineKey.FLOWCHART_ID));
        logData.setIndexPath(phaseCtx.getProperty(LogLineKey.INDEX_PATH));
        logData.setStatus(phaseCtx.getStatus());
        logData.setStartOffset(offset);
        logData.setEndOffset(offset);
        logData.setLogLineType(LogLineType.PHASE);
        logData.setType(category);

        // 2) Extract flat properties
        Map<String, Object> flatProps = extractFlatProperties(phaseCtx.getProperties());
        logData.setProperties(flatProps);

        // 3) Build segments and errors
        SegmentAggregate agg = buildSegments(phaseCtx.getSegments());

        // 4) Assemble segment object
        Map<String, Object> segment = new LinkedHashMap<>();
        if (!agg.refs.isEmpty())    segment.put(LogLineKey.REF.getSrcName(), agg.refs);
        if (agg.ifResult != null)   segment.put("value", agg.ifResult);
        logData.setSegments(segment);

        // 5) Attach error if present
        logData.setError(agg.error);

        return logData;
    }

    private Map<String, Object> extractFlatProperties(Map<LogLineKey, String> props) {
        if (props == null || props.isEmpty()) {
            return Collections.emptyMap();
        }
        return props.entrySet().stream()
                .filter(e -> excludeKey(e.getKey()))
                .collect(Collectors.toMap(
                        e -> e.getKey().getSrcName(),    // use the enum name as the String key
                        Map.Entry::getValue,       // the original String value
                        (a, b) -> b,               // on duplicate key, keep the latter
                        LinkedHashMap::new         // preserve insertion order
                ));
    }

    private boolean excludeKey(LogLineKey key) {
        return !Set.of(
                LogLineKey.CONNECTOR_NAME,
                LogLineKey.INDEX_PATH,
                LogLineKey.FLOWCHART_ID
        ).contains(key);
    }

    private SegmentAggregate buildSegments(List<SegmentContext> segments) {
        SegmentAggregate agg = new SegmentAggregate();
        for (SegmentContext ctx : segments) {
            Map<LogLineKey, String> p = ctx.getAllProperties();
            switch (ctx.getSegmentType()) {
                case IF_REF -> {
                    String ref = p.get(LogLineKey.REF);
                    String data = p.get(LogLineKey.DATA);
                    if (ref != null && data != null) {
                        agg.refs.add(Map.of("ref", ref, "value", data));
                    }
                }
                case IF_RESULT -> agg.ifResult = p.get(LogLineKey.DATA);
                case EXCEPTION -> {
                    String data = p.getOrDefault(LogLineKey.DATA, "");
                    agg.error = parseErrorInfo(data);
                }
                default -> {}
            }
        }
        return agg;
    }

    private LogDataError parseErrorInfo(String data) {
        if (data == null || data.isBlank()) {
            return new LogDataError();
        }
        String[] lines = data.split("\\R");
        String message = lines[0];
        List<String> stack = new ArrayList<>();
        for (int i = 1; i < lines.length; i++) {
            String l = lines[i].strip();
            if (!l.isEmpty()) stack.add(l);
        }
        return new LogDataError(message, stack);
    }

    private static class SegmentAggregate {
        final List<Map<String, String>> refs = new ArrayList<>();
        String ifResult;
        LogDataError error = new LogDataError();
    }
}

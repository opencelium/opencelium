package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.*;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.execution.logger.keys.LogLineKey.CONNECTOR_NAME;

public class LoopLogDataBuilder implements PhaseBuilder {

    @Override
    public LogData build(PhaseContext phaseCtx, String execId, Long connId) {
        var parsed = phaseCtx.getParsedLogLine();
        PhaseCategory category = PhaseCategory.fromValue((PhaseType) parsed.getStage());
        long offset = parsed.getOffset();

        // 1) Core LogData setup
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
        var flatProps = extractFlatProperties(phaseCtx.getProperties());

        // 3) Aggregate segments
        var agg = buildSegments(phaseCtx.getSegments());

        // 4) Merge segment data into properties
        if (!agg.refs.isEmpty()) {
            flatProps.put(LogLineKey.REF.name(), agg.refs);
        }
        if (!agg.error.isBlank()) {
            flatProps.put(LogLineKey.EXCEPTION.name(), agg.error);
        }

        logData.setProperties(flatProps);
        return logData;
    }

    private Map<String, Object> extractFlatProperties(Map<LogLineKey, String> props) {
        if (props == null || props.isEmpty()) {
            return Collections.emptyMap();
        }
        return props.entrySet().stream()
                .filter(e -> excludeKey(e.getKey()))
                .collect(Collectors.toMap(
                        e -> e.getKey().name(),    // use the enum name as the String key
                        Map.Entry::getValue,       // the original String value
                        (a, b) -> b,               // on duplicate key, keep the latter
                        LinkedHashMap::new         // preserve insertion order
                ));
    }

    private boolean excludeKey(LogLineKey key) {
        return !Set.of(
                CONNECTOR_NAME,
                LogLineKey.INDEX_PATH,
                LogLineKey.FLOWCHART_ID
        ).contains(key);
    }

    private SegmentAggregate buildSegments(List<SegmentContext> segments) {
        var agg = new SegmentAggregate();
        for (SegmentContext ctx : segments) {
            var p = ctx.getAllProperties();
            switch (ctx.getSegmentType()) {
                case LOOP_REF -> {
                    var name = p.get(LogLineKey.REF);
                    var value = p.get(LogLineKey.DATA);
                    if (name != null && value != null) {
                        agg.refs.add(Map.of("name", name, "value", value));
                    }
                }
                case EXCEPTION -> agg.error = p.getOrDefault(LogLineKey.DATA, "");
                default -> {}
            }
        }
        return agg;
    }

    private static class SegmentAggregate {
        final List<Map<String, String>> refs = new ArrayList<>();
        String error = "";
    }
}
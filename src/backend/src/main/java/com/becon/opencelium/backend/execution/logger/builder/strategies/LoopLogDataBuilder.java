package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.database.mongodb.entity.LogDataError;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.dto.ErrorDetail;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.bson.types.ObjectId;

import java.util.*;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.execution.logger.keys.LogLineKey.*;

public class LoopLogDataBuilder implements PhaseBuilder {

    @Override
    public LogDataMng build(PhaseContext phaseCtx, String execId, String flowId, Long connId) {
        ParsedLogLine parsed = phaseCtx.getParsedLogLine();
        PhaseCategory category = PhaseCategory.fromValue((PhaseType) parsed.getStage());

        // 1) Core LogData setup
        LogDataMng logDataMng = new LogDataMng();
        logDataMng.setId(new ObjectId().toHexString());
        logDataMng.setExecutionId(execId);
        logDataMng.setConnectionId(connId);
        logDataMng.setFlowId(flowId);
        logDataMng.setIndexPath(phaseCtx.getProperty(LogLineKey.INDEX_PATH));
        logDataMng.setStatus(phaseCtx.getStatus());
        logDataMng.setStartOffset(phaseCtx.getStartOffset());
        logDataMng.setEndOffset(phaseCtx.getEndOffset());
        logDataMng.setLogLineType(LogLineType.PHASE);
        logDataMng.setType(category);

        // 2) Extract flat properties
        var flatProps = extractFlatProperties(phaseCtx.getProperties());

        // 3) Aggregate segments
        var agg = buildSegments(phaseCtx.getSegments());

        // 4) Merge segment data into properties
        if (!agg.refs.isEmpty()) {
            logDataMng.getSegments().put(LogLineKey.REF.getSrcName(), agg.refs);
        }

        ErrorDetail errorDetail = phaseCtx.getErrorDetail();
        if (phaseCtx.getErrorDetail() != null) {
            logDataMng.setError(mapCtxError(errorDetail));
        }

        logDataMng.setProperties(flatProps);
        return logDataMng;
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
                CONNECTOR_NAME,
                LogLineKey.INDEX_PATH,
                LogLineKey.FLOWCHART_ID,
                CONNECTION_ID,
                EXECUTION_ID
        ).contains(key);
    }

    private LogDataError mapCtxError(ErrorDetail errorDetail) {
        LogDataError error = new LogDataError();
        error.setMessage(errorDetail.getException().getProperty(DATA));
        error.setErrorOfOriginPath(errorDetail.getErrorOriginPath());
        error.setStackTrace(errorDetail.getStackTrace());
        return error;
    }

    private SegmentAggregate buildSegments(List<SegmentContext> segments) {
        var agg = new SegmentAggregate();
        for (SegmentContext ctx : segments) {
            var p = ctx.getAllProperties();
            if (ctx.getSegmentType() == SegmentType.LOOP_REF) {
                var name = p.get(REF);
                var value = p.get(DATA);
                if (name != null && value != null) {
                    agg.refs.add(Map.of("name", name, "value", value));
                }
            }
        }
        return agg;
    }

    private static class SegmentAggregate {
        final List<Map<String, String>> refs = new ArrayList<>();
    }
}
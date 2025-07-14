package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.enums.*;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.*;

public class OperationLogDataBuilder implements PhaseBuilder {

    @Override
    public LogData build(PhaseContext phaseCtx, String execId, Long connId) {
        PhaseCategory category = PhaseCategory.fromValue((PhaseType)phaseCtx.getParsedLogLine().getStage());
        LogData logData = new LogData();
        logData.setId(UUID.randomUUID().toString());
        logData.setExecutionId(execId);
        logData.setConnectionId(connId);
        logData.setFlowchartId(phaseCtx.getProperties().get(LogLineKey.FLOWCHART_ID));
        logData.setStatus(phaseCtx.getStatus());
        logData.setIndexPath(phaseCtx.getProperties().get(LogLineKey.INDEX_PATH));
        logData.setStartOffset(phaseCtx.getParsedLogLine().getOffset());
        logData.setEndOffset(phaseCtx.getParsedLogLine().getOffset());
        logData.setLogLineType(LogLineType.PHASE);
        logData.setType(category);
//        logData.setCreatedAt(Instant.now());
        // Copy base phase properties
        Map<LogLineKey, Object> props = new HashMap<>(phaseCtx.getProperties());

        // Process segments
        for (SegmentContext segment : phaseCtx.getSegments()) {
//            LogLineStage seg = segment.getSegmentType();
            ;
            if (segment.getSegmentType() == SegmentType.EXCEPTION) {
                String value = segment.getAllProperties().get(LogLineKey.DATA);
                props.put(LogLineKey.EXCEPTION, value);
                continue;
            }
            props.putAll(segment.getAllProperties());
        }

        logData.setProperties(props);
        return logData;
    }
}

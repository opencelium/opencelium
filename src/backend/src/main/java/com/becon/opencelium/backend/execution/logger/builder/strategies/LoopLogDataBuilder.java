package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.enums.*;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.*;

public class LoopLogDataBuilder implements PhaseBuilder {
    @Override
    public LogData build(PhaseContext context, String execId, Long connId) {
        PhaseCategory category = PhaseCategory.fromValue((PhaseType)context.getParsedLogLine().getStage());
        LogData logData = new LogData();
        logData.setId(UUID.randomUUID().toString());
        logData.setExecutionId(execId);
        logData.setConnectionId(connId);
        logData.setFlowchartId(context.getProperties().get(LogLineKey.FLOWCHART_ID));
        logData.setStatus(context.getStatus());
        logData.setIndexPath(context.getProperties().get(LogLineKey.INDEX_PATH));
        logData.setStartOffset(context.getParsedLogLine().getOffset());
        logData.setEndOffset(context.getParsedLogLine().getOffset());
        logData.setLogLineType(LogLineType.PHASE);
        logData.setType(category);

        // Copy base phase properties
        Map<LogLineKey, Object> finalProps = new HashMap<>(context.getProperties());

        // 2) Handle LOOP_REF segments with potential duplicates into a unified "ref" list
        List<Map<String, String>> refList = new ArrayList<>();
        for (SegmentContext seg : context.getSegments()) {
            if (seg.getSegmentType() == SegmentType.LOOP_REF) {
                String refName = seg.getAllProperties().get(LogLineKey.REF);
                String refValue = seg.getAllProperties().get(LogLineKey.DATA);
                if (refName != null && refValue != null) {
                    refList.add(Map.of("name", refName, "value", refValue));
                }
            } else if (seg.getSegmentType() == SegmentType.EXCEPTION) {
                finalProps.put(LogLineKey.EXCEPTION, seg.getAllProperties().get(LogLineKey.DATA));
            }
        }
        if (!refList.isEmpty()) {
            finalProps.put(LogLineKey.REF, refList);
        }

        logData.setProperties(finalProps);
        return logData;
    }
}

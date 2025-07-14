package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class IfLogDataBuilder implements PhaseBuilder {

    @Override
    public LogData build(PhaseContext context, String execId, Long connId) {
        LogData logData = new LogData();
        PhaseCategory category = PhaseCategory.fromValue((PhaseType)context.getParsedLogLine().getStage());
        logData.setExecutionId(execId);
        logData.setConnectionId(connId);
        logData.setFlowchartId(context.getProperties().getOrDefault(LogLineKey.FLOWCHART_ID, null));
        logData.setStatus(context.getStatus());
        logData.setLogLineType(LogLineType.PHASE);
        logData.setType(category);
        logData.setIndexPath(context.getProperties().get(LogLineKey.INDEX_PATH));

        if (context.getParsedLogLine() != null) {
            logData.setStartOffset(context.getParsedLogLine().getOffset());
            logData.setEndOffset(context.getParsedLogLine().getOffset()); // For IF, usually same line
        }

        // Copy allowed IF properties
        Map<LogLineKey, Object> finalProps = new HashMap<>(context.getProperties());

        // Handle IF segments (IF_RESULT, IF_REF, EXCEPTION)
        for (SegmentContext segment : context.getSegments()) {
            switch (segment.getSegmentType()) {
                case IF_RESULT -> {
                    // Just one key: data
                    String result = segment.getAllProperties().get(LogLineKey.DATA);
                    if (result != null) {
                        finalProps.put(LogLineKey.RESULT, result);
                    }
                }
                case IF_REF -> {
                    // Collect multiple refs into one list
                    String ref = segment.getAllProperties().get(LogLineKey.REF);
                    String data = segment.getAllProperties().get(LogLineKey.DATA);
                    if (ref != null && data != null) {
                        Map<String, String> refEntry = Map.of("name", ref, "value", data);
                        Object existing = finalProps.get(LogLineKey.REF);
                        if (existing instanceof List<?> list) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, String>> refList = (List<Map<String, String>>) list;
                            refList.add(refEntry);
                        } else {
                            List<Map<String, String>> refList = new ArrayList<>();
                            refList.add(refEntry);
                            finalProps.put(LogLineKey.REF, refList);
                        }
                    }
                }
                case EXCEPTION -> {
                    String data = segment.getAllProperties().get(LogLineKey.DATA);
                    if (data != null) {
                        finalProps.put(LogLineKey.EXCEPTION, data);
                    }
                }
                default -> {
                    // Skip other segment types
                }
            }
        }

        logData.setProperties(finalProps);
//        logData.setCreatedAt(Instant.now());

        return logData;
    }
}

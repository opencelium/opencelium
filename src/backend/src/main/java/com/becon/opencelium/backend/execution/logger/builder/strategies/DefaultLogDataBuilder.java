package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class DefaultLogDataBuilder implements PhaseBuilder {
    @Override
    public LogData build(PhaseContext context, String execId, Long connId) {
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

        // Determine and set type from phase
        if (context.getParsedLogLine().getStage() instanceof PhaseType phaseType) {
            logData.setType(PhaseCategory.fromValue(phaseType));
        } else {
            logData.setType(PhaseCategory.UNKNOWN);
        }

        // Copy basic properties
        Map<LogLineKey, Object> props = new HashMap<>(context.getProperties());
        logData.setProperties(props);

        return logData;
    }
}

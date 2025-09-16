package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.database.mongodb.entity.LogDataError;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.dto.ErrorDetail;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import org.bson.types.ObjectId;

import java.util.*;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.execution.logger.keys.LogLineKey.DATA;

public class DefaultLogDataBuilder implements PhaseBuilder {
    @Override
    public LogData build(PhaseContext context, String execId, String flowId, Long connId) {
        LogData logData = new LogData();
        logData.setId(new ObjectId().toHexString());
        logData.setExecutionId(execId);
        logData.setConnectionId(connId);
        logData.setFlowId(flowId);
        logData.setConnectorName(context.getProperty(LogLineKey.CONNECTOR_NAME));
        logData.setFlowId(context.getProperties().get(LogLineKey.FLOWCHART_ID));
        logData.setStatus(context.getStatus());
        logData.setIndexPath(context.getProperties().get(LogLineKey.INDEX_PATH));
        logData.setStartOffset(context.getStartOffset());
        logData.setEndOffset(context.getEndOffset());
        logData.setLogLineType(LogLineType.PHASE);

        // Determine and set type from phase
        if (context.getParsedLogLine().getStage() instanceof PhaseType phaseType) {
            logData.setType(PhaseCategory.fromValue(phaseType));
        } else {
            logData.setType(PhaseCategory.UNKNOWN);
        }

        ErrorDetail errorDetail = context.getErrorDetail();
        if (context.getErrorDetail() != null) {
            logData.setError(mapCtxError(errorDetail));
        }

        // Copy basic properties
        Map<String, Object> props = toStringKeyMap(context.getProperties());
        logData.setProperties(props);

        return logData;
    }

    /**
     * Converts a Map keyed by LogLineKey into a Map keyed by String (the enum's name),
     * preserving insertion order.
     */
    private Map<String, Object> toStringKeyMap(Map<LogLineKey, String> props) {
        if (props == null || props.isEmpty()) {
            return Collections.emptyMap();
        }
        return props.entrySet().stream()
                .filter(k -> k.getValue() != null && excludeKey(k.getKey()))
                .collect(Collectors.toMap(
                        e -> e.getKey().name(),   // enum name as string key
                        Map.Entry::getValue,      // same value
                        (a, b) -> b,              // on duplicate (shouldn't happen), keep latter
                        LinkedHashMap::new        // preserve original order
                ));
    }

    private LogDataError mapCtxError(ErrorDetail errorDetail) {
        LogDataError error = new LogDataError();
        error.setMessage(errorDetail.getException().getProperty(DATA));
        error.setErrorOfOriginPath(errorDetail.getErrorOriginPath());
        error.setStackTrace(errorDetail.getStackTrace());
        return error;
    }

    private boolean excludeKey(LogLineKey key) {
        return !Set.of(
                LogLineKey.CONNECTOR_NAME,
                LogLineKey.INDEX_PATH,
                LogLineKey.FLOWCHART_ID,
                LogLineKey.CONNECTION_ID,
                LogLineKey.EXECUTION_ID
        ).contains(key);
    }
}

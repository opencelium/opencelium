package com.becon.opencelium.backend.execution.logger.builder;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;

public interface PhaseBuilder {
    LogData build(PhaseContext context, String execId,String flowId, Long connId);
}

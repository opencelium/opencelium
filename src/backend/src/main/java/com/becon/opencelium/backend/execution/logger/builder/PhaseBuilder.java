package com.becon.opencelium.backend.execution.logger.builder;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;

public interface PhaseBuilder {
    LogDataMng build(PhaseContext context, String execId, String flowId, Long connId);
}

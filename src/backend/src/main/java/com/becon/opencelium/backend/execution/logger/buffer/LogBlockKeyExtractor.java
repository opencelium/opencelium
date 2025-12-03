package com.becon.opencelium.backend.execution.logger.buffer;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;

@FunctionalInterface
public interface LogBlockKeyExtractor {
    String extractKey(LogDataMng block);
}

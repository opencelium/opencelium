package com.becon.opencelium.backend.execution.log_managing.core;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import java.util.Optional;

public interface ExecutionContextManager {
    Optional<LogMetaData> track(String executionId, ParsedLogLine line);

    void cleanUp(String execId);
}
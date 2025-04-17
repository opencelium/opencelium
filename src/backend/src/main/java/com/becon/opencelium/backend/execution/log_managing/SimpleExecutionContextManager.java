package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.core.ExecutionContextManager;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;

import java.util.Optional;

public class SimpleExecutionContextManager implements ExecutionContextManager {

    // TODO: OC-1087, Implement the methods

    @Override
    public Optional<LogMetaData> track(String executionId, ParsedLogLine line) {
        return Optional.empty();
    }

    @Override
    public void cleanUp(String execId) {
    }
}
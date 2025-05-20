package com.becon.opencelium.backend.execution.log_managing.core;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import java.util.Optional;

public interface ExecutionContextManager {
    /**
     * Tracks a structured log line for a given execution ID
     */
    Optional<LogMetaData> track(String executionId, ParsedLogLine line);

    /**
     * Cleans up the resources associated with the given execution ID.
     * This should be called when the execution completes or times out.
     */
    void cleanUp(String execId);

    /**
     * Attempts to append an unstructured line to the most recent active tracker
     * within the context of the given execution ID.
     */
    void tryHandleNotStructuredLine(String executionId, String line);
}
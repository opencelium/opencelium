package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.execution.logger.service.LogMetaDataService;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


/**
 * Registry responsible for managing active ExecutionLogTracker instances.
 *
 * Each ExecutionLogTracker tracks the state of a single execution (based on executionId).
 * This registry allows for creation, lookup, and removal of trackers as log lines are processed.
 */
@Component
public class ExecutionTrackerRegistry {

    // Stores active trackers keyed by executionId
    private final Map<String, ExecutionLogTracker> managers = new ConcurrentHashMap<>();
    private final LogMetaDataService logMetaDataService;

    public ExecutionTrackerRegistry(LogMetaDataService logMetaDataService) {
        this.logMetaDataService = logMetaDataService;
    }

    /**
     * Get an existing tracker for the given executionId, or create one if it does not exist.
     *
     * @param executionId unique ID of the execution (from EXECUTION_START log line)
     * @param connectionId connection ID for the system that initiated the execution
     * @return an existing or newly created ExecutionLogTracker
     */
    public ExecutionLogTracker getOrCreate(String executionId, Long connectionId) {
        return managers.computeIfAbsent(executionId, id -> new ExecutionLogTracker(executionId, connectionId, logMetaDataService));
    }

    /**
     * Get the tracker for the given executionId, or null if none exists.
     *
     * @param executionId execution identifier
     * @return ExecutionLogTracker or null
     */
    public ExecutionLogTracker get(String executionId) {
        return managers.get(executionId);
    }

    /**
     * Remove the tracker for the given executionId when the execution ends.
     *
     * @param executionId execution identifier
     */
    public void remove(String executionId) {
        managers.remove(executionId);
    }
}

package com.becon.opencelium.backend.execution.logger;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.enums.LogProcessingMode;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTracker;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTrackerImpl;

import java.util.Map;
import java.util.Optional;

/**
 * LogLineDispatcher is responsible for routing parsed log lines to the appropriate ExecutionTracker.
 *
 * Responsibilities:
 * - Filter and parse raw log lines using ParsedLogLineBuilder
 * - Manage the lifecycle of ExecutionTrackers via ExecutionTrackerRegistry
 * - Forward parsed PHASE-type lines to the currently active tracker
 */
public class LogLineDispatcher {
    private final ThreadLocal<ExecutionTracker> tls = new ThreadLocal<>();

    public Optional<LogData> dispatch(ParsedLogLine parsedLine) {
        return dispatch(parsedLine, LogProcessingMode.METADATA);
    }

    public Optional<LogData> dispatch(ParsedLogLine parsedLine, LogProcessingMode mode) {
        Map<String, String> props = parsedLine.getProperties();
        String execId, connId;
        switch (parsedLine.getStage()) {
            case EXECUTION_START -> {
                execId = props.get("id");
                connId = props.get("connectionId");
                tls.set(new ExecutionTrackerImpl(execId, connId, null, mode));
                return Optional.empty();
            }
            case EXECUTION_END -> {
                ExecutionTracker tracker = tls.get();
                if (tracker != null) {
                    tracker.buildLogData(parsedLine);
                }
                tls.remove();
                return Optional.empty();
            }
            default -> Optional.empty();
        }

        ExecutionTracker tracker = tls.get();
        return (tracker == null) ? Optional.empty() : tracker.buildLogData(parsedLine);
    }

    public Object toDto(LogData logData) {
        return "Hello";
    }
}

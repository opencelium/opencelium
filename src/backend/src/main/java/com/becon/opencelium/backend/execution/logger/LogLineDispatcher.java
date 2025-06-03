package com.becon.opencelium.backend.execution.logger;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.logger.enums.LogLineStage;
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
    public Optional<LogMetaData> dispatch(ParsedLogLine parsedLine) {
        return dispatch(parsedLine, LogProcessingMode.METADATA);
    }

    public Optional<LogMetaData> dispatch(ParsedLogLine parsedLine, LogProcessingMode mode) {
        if (parsedLine.getStage() == LogLineStage.EXECUTION_START) {
            Map<String, String> props = parsedLine.getProperties();
            String execId = props.get("id");
            String connId = props.get("connectionId");
            tls.set(new ExecutionTrackerImpl(execId, connId, mode));
            return Optional.empty();
        }
        if (parsedLine.getStage() == LogLineStage.EXECUTION_END) {
            ExecutionTracker tracker = tls.get();
            if (tracker != null) {
                tracker.handleParsedLine(parsedLine);
            }
            tls.remove();
            return Optional.empty();
        }
        ExecutionTracker tracker = tls.get();
        return (tracker == null) ? Optional.empty() : tracker.handleParsedLine(parsedLine);
    }

    public Object toDto(LogMetaData logMetaData) {
        return "Hello";
    }
}

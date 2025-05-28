package com.becon.opencelium.backend.execution.logger;

import com.becon.opencelium.backend.execution.logger.tracker.ExecutionLogTracker;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTracker;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTrackerRegistry;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.LogLineValue;
import com.becon.opencelium.backend.execution.logger.parser.ParsedLogLineBuilder;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

/**
 * LogLineDispatcher is responsible for routing parsed log lines to the appropriate ExecutionTracker.
 *
 * Responsibilities:
 * - Filter and parse raw log lines using ParsedLogLineBuilder
 * - Manage the lifecycle of ExecutionTrackers via ExecutionTrackerRegistry
 * - Forward parsed PHASE-type lines to the currently active tracker
 */
@Component
public class LogLineDispatcher {

    private final ParsedLogLineBuilder builder;
    private final ExecutionTrackerRegistry registry;

    // Keeps track of the currently active execution session
    private ExecutionTracker currentTracker;

    public LogLineDispatcher(ParsedLogLineBuilder builder, ExecutionTrackerRegistry registry) {
        this.builder = builder;
        this.registry = registry;
    }

    /**
     * Dispatches a raw log line to the appropriate execution tracker.
     *
     * @param rawLine the raw log line as read from the log stream
     * @param offset the byte or character offset of the line in the original log source
     */
    public void dispatch(String rawLine, long offset) {
        // 1. Skip unsupported lines
        if (!builder.supports(rawLine)) return;

        // 2. Parse line into structured form
        ParsedLogLine parsedLine = builder.build(rawLine, offset);

        // 3. Dispatch based on log type/value
        if (parsedLine.getLogLineType() != LogLineType.PHASE) return;

        LogLineValue value = parsedLine.getValue();

        // 4. Handle the start of a new execution context
        if (value == LogLineValue.EXECUTION_START) {
            String executionId = parsedLine.getProperties().get("id");
            String connectionId = parsedLine.getProperties().get("connectionId");
            // Get or create a new tracker for this execution
            currentTracker = registry.getOrCreate(executionId, Long.parseLong(connectionId));
        }

        // 5. Handle the end of an execution context
        if (value == LogLineValue.EXECUTION_END) {
            String executionId = parsedLine.getProperties().get("id");
            registry.remove(executionId);
        }

        // 6. Forward the parsed line to the currently active tracker (if any)
        if (currentTracker != null) {
            currentTracker.handleParsedLine(parsedLine);
        }
    }
}

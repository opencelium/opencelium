package com.becon.opencelium.backend.execution.logger;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;
import com.becon.opencelium.backend.execution.logger.parser.ParsedLogLineBuilder;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import com.becon.opencelium.backend.execution.logger.service.LogDataServiceImp;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTracker;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTrackerImpl;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;

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
    private final ParsedLogLineBuilder parsedLogLineBuilder;
    private final LogDataService logMetaDataService;

    public LogLineDispatcher() {
        this.parsedLogLineBuilder = ApplicationContextUtility.getBean(ParsedLogLineBuilder.class);
        this.logMetaDataService = ApplicationContextUtility.getBean(LogDataServiceImp.class);
    }

    public Optional<LogDataDTO> dispatch(String logLine, long startOffset, long endOffset) {
        return dispatch(logLine, startOffset, endOffset, LogDetailLevel.LIGHTWEIGHT);
    }

    public Optional<LogDataDTO> dispatch(String logLine, long startOffset, long endOffset, LogDetailLevel logLevelMode) {
        ParsedLogLine parsed = parsedLogLineBuilder.build(logLine, startOffset, endOffset);
        // Handle the start of a new execution
        if (parsed.getStage() == PhaseType.EXECUTION_START) {
            tls.set(new ExecutionTrackerImpl(logLevelMode));
        }

        // Grab the current tracker once
        ExecutionTracker tracker = tls.get();

        // Handle the end of an execution
        if (parsed.getStage() == PhaseType.EXECUTION_END) {
            tls.remove();
        }

        // For any other stage, if no tracker is active we do nothing
        if (tracker == null) {
            return Optional.empty();
        }

        // Build, save (if present), and map to DTO
        Optional<LogDataMng> logData = tracker.buildLogData(parsed);
        if (logData.isEmpty()) {
            return Optional.empty();
        }
        LogDataMng data = logData.get();
        logMetaDataService.save(data);

        return logMetaDataService.toDto(data);
    }
}

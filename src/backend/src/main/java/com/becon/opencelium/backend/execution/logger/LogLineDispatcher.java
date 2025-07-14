package com.becon.opencelium.backend.execution.logger;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.parser.ParsedLogLineBuilder;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.service.LogMetaDataService;
import com.becon.opencelium.backend.execution.logger.service.LogMetaDataServiceImp;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTracker;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTrackerImpl;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;

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
    private final ParsedLogLineBuilder parsedLogLineBuilder;
    private final LogMetaDataService logMetaDataService;

    public LogLineDispatcher() {
        this.parsedLogLineBuilder = ApplicationContextUtility.getBean(ParsedLogLineBuilder.class);
        this.logMetaDataService = ApplicationContextUtility.getBean(LogMetaDataServiceImp.class);
    }

    public Optional<LogDataDTO> dispatch(String logLine, long startOffset) {
        return dispatch(logLine, startOffset, LogDetailLevel.LIGHTWEIGHT);
    }

    public Optional<LogDataDTO> dispatch(String logLine, long startOffset, LogDetailLevel mode) {
        ParsedLogLine parsed = parsedLogLineBuilder.build(logLine, startOffset);
        // Handle the start of a new execution
        if (parsed.getStage() == PhaseType.EXECUTION_START) {
            Map<LogLineKey,String> p = parsed.getProperties();
            tls.set(new ExecutionTrackerImpl(
                    p.get(LogLineKey.EXECUTION_ID),
                    p.get(LogLineKey.CONNECTION_ID),
                    null,
                    mode
            ));
            return Optional.empty();
        }

        // Grab the current tracker once
        ExecutionTracker tracker = tls.get();

        // Handle the end of an execution
        if (parsed.getStage() == PhaseType.EXECUTION_END) {
//            if (tracker != null) {
//                tracker.buildLogData(parsed);
//            }
            tls.remove();
            return Optional.empty();
        }

        // For any other stage, if no tracker is active we do nothing
        if (tracker == null) {
            return Optional.empty();
        }

        // Build, save (if present), and map to DTO
        Optional<LogData> logData = tracker.buildLogData(parsed);
        if (logData.isEmpty()) {
            return Optional.empty();
        }
        LogData data = logData.get();
        logMetaDataService.save(data);

        return logMetaDataService.toDto(data);
    }
}

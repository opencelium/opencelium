package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.logger.enums.LogLineValue;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.service.LogMetaDataService;

/**
 * ExecutionLogTracker is responsible for tracking the state and lifecycle of a single execution.
 *
 * It maintains:
 * - The executionId (unique per execution session)
 * - The connectionId (system connection source)
 * - The current flowchartId (which may change during execution)
 *
 * It delegates persistence of parsed blocks to ParsedLogBlockService.
 * It only processes PHASE-type log lines and tracks blocks like IF, LOOP, METHOD, etc.
 */
public class ExecutionLogTracker implements ExecutionTracker {
    private final String executionId;
    private final Long connectionId;
    private Integer flowchartId;

    private final LogMetaDataService logMetaDataService;

    public ExecutionLogTracker(String executionId, long connectionId, LogMetaDataService logMetaDataService) {
        this.executionId = executionId;
        this.connectionId = connectionId;
        this.logMetaDataService = logMetaDataService;
    }

    /**
     * Handles a parsed PHASE log line.
     *
     * This method is invoked by the LogLineDispatcher once a line is associated with this execution.
     * It enriches the line with execution context and either stores or updates block metadata in MongoDB.
     *
     * @param line ParsedLogLine containing phase information and properties
     */
    @Override
    public LogMetaData handleParsedLine(ParsedLogLine line) {
        LogLineValue value = line.getValue();

        // 1. Set current flowchart ID if FLOWCHART_START is encountered
        if (value == LogLineValue.FLOWCHART_START) {
            this.flowchartId = Integer.parseInt(line.getProperties().get("fchartId"));
        }

        // 2. Ignore the line if we haven't seen a FLOWCHART_START yet
        if (flowchartId == null) {
            throw new RuntimeException(String.format("FlowchartId %d not found in line %s ", flowchartId, line));
        }

        // 3. Enrich line with execution, connection, and flowchart context
        LogMetaData logMetaData = logMetaDataService.fromParsedLogLine(line,
                executionId, connectionId, flowchartId);

        // 4. If this is a *_START phase, persist new block with startOffset
        if (value.name().endsWith("_START")) {
            logMetaDataService.saveStartBlock(logMetaData);
        }

        // 5. If this is a *_END phase, update the existing block's endOffset
        if (value.name().endsWith("_END")) {
            logMetaDataService.updateEndOffset(logMetaData);
        }

        return logMetaData;
    }
}

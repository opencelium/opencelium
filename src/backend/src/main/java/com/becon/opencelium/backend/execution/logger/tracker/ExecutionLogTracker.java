package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.ParsedLogBlockDocument;
import com.becon.opencelium.backend.execution.logger.enums.LogLineValue;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.service.ParsedLogBlockService;

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

    private final ParsedLogBlockService blockService;

    public ExecutionLogTracker(String executionId, long connectionId, ParsedLogBlockService blockService) {
        this.executionId = executionId;
        this.connectionId = connectionId;
        this.blockService = blockService;
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
    public void handleParsedLine(ParsedLogLine line) {
        LogLineValue value = line.getValue();

        // 1. Set current flowchart ID if FLOWCHART_START is encountered
        if (value == LogLineValue.FLOWCHART_START) {
            this.flowchartId = Integer.parseInt(line.getProperties().get("fchartId"));
        }

        // 2. Ignore the line if we haven't seen a FLOWCHART_START yet
        if (flowchartId == null) return;

        // 3. Enrich line with execution, connection, and flowchart context
        ParsedLogBlockDocument parsedLogBlockDocument = blockService.fromParsedLogLine(line,
                executionId, connectionId, flowchartId);

        // 4. If this is a *_START phase, persist new block with startOffset
        if (value.name().endsWith("_START")) {
            blockService.saveStartBlock(parsedLogBlockDocument);
        }

        // 5. If this is a *_END phase, update the existing block's endOffset
        if (value.name().endsWith("_END")) {
            blockService.updateEndOffset(parsedLogBlockDocument);
        }
    }
}

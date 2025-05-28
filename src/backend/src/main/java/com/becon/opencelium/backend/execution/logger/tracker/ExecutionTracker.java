package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

public interface ExecutionTracker {
    void handleParsedLine(ParsedLogLine line);
}

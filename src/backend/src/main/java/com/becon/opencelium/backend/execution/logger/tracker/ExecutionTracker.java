package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

public interface ExecutionTracker {
    LogMetaData handleParsedLine(ParsedLogLine line);
}

package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.Optional;

public interface ExecutionTracker {

    Optional<LogData> buildLogData(ParsedLogLine parsedLine);
}

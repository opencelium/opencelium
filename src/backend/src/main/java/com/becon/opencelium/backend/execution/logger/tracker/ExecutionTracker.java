package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.Optional;

public interface ExecutionTracker {

    Optional<LogDataMng> buildLogData(ParsedLogLine parsedLine);
}

package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.logger.enums.LogProcessingMode;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.Optional;

public interface ExecutionTracker {

    Optional<LogMetaData> handleParsedLine(ParsedLogLine parsedLine);
}

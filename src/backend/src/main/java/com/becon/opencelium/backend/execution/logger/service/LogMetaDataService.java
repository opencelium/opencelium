package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

public interface LogMetaDataService {
    void saveStartBlock(LogData block);

    void updateEndOffset(LogData block);

    LogData fromParsedLogLine(ParsedLogLine line, String executionId,
                              Long connectionId, String flowchartId);
}

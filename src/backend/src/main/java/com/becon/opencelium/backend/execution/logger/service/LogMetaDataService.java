package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

public interface LogMetaDataService {
    void saveStartBlock(LogMetaData block);

    void updateEndOffset(LogMetaData block);

    LogMetaData fromParsedLogLine(ParsedLogLine line, String executionId,
                                  Long connectionId, int flowchartId);
}

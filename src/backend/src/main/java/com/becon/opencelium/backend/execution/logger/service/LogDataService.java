package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.Optional;

public interface LogDataService {
    void saveNewBlock(LogData block);

    void updateExistingBlock(LogData block);

    LogData fromParsedLogLine(ParsedLogLine line, String executionId,
                              Long connectionId, String flowchartId);

    void save(LogData logData);

    Optional<LogDataDTO> toDto(LogData metaData);
}

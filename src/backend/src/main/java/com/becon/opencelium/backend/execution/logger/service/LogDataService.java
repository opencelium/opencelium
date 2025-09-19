package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.List;
import java.util.Optional;

public interface LogDataService {
    List<LogDataDTO> getChildrenById(String elementId, String loopIndex);

    LogDataDTO getDetailsById(String elementId);

    void saveNewBlock(LogDataMng block);

    void updateExistingBlock(LogDataMng block);

    LogDataMng fromParsedLogLine(ParsedLogLine line, String executionId,
                                 Long connectionId, String flowchartId);

    void save(LogDataMng logDataMng);

    Optional<LogDataDTO> toDto(LogDataMng metaData);
}

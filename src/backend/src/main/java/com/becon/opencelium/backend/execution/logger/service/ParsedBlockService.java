package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.ParsedLogBlockDocument;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

public interface ParsedBlockService {
    void saveStartBlock(ParsedLogBlockDocument block);

    void updateEndOffset(ParsedLogBlockDocument block);

    ParsedLogBlockDocument fromParsedLogLine(ParsedLogLine line, String executionId,
                                             Long connectionId, int flowchartId);
}

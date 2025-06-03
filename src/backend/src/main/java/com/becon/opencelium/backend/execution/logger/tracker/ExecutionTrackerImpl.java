package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.logger.enums.LogProcessingMode;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.service.LogMetaDataService;
import com.becon.opencelium.backend.execution.logger.service.LogMetaDataServiceImp;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;

import java.util.Optional;

public class ExecutionTrackerImpl implements ExecutionTracker{
    private final String execId;
    private final String connId;
    private String flowId;
    private final LogProcessingMode mode;

    private final LogMetaDataService metaDataService;


    public ExecutionTrackerImpl(String execId, String connId, LogProcessingMode mode) {
        this.execId = execId;
        this.connId = connId;
        this.mode = mode;
        this.metaDataService = ApplicationContextUtility.getBean(LogMetaDataServiceImp.class);
    }

    @Override
    public Optional<LogMetaData> handleParsedLine(ParsedLogLine parsedLine) {
        return Optional.empty();
    }
}

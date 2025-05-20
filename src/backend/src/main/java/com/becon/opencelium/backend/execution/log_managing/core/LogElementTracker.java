package com.becon.opencelium.backend.execution.log_managing.core;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;

public interface LogElementTracker {
    void onStart(ParsedLogLine line, long startOffset);

    void onContent(ParsedLogLine line);

    LogMetaData onEnd(ParsedLogLine line);

    /**
     * Implement supporting logic if the tracker supports an unstructured line
     */
    default void onNotStructuredLine(String line) {
        throw LogProcessingException.unsupportedLineFound(line);
    }
}
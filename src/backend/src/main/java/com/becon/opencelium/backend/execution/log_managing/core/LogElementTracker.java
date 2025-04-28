package com.becon.opencelium.backend.execution.log_managing.core;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;

public interface LogElementTracker {
    void onStart(ParsedLogLine line, long startOffset);
    void onContent(ParsedLogLine line);
    LogMetaData onEnd(ParsedLogLine line);
}
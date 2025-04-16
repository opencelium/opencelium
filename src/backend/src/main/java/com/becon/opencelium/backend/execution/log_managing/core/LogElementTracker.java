package com.becon.opencelium.backend.execution.log_managing.core;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;

public interface LogElementTracker {
    void onStart(ParsedLogLine line, long offset);
    void onContent(ParsedLogLine line, long offset);
    void onEnd(ParsedLogLine line, long offset);
    boolean isComplete();
    LogMetaData build();
}
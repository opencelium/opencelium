package com.becon.opencelium.backend.execution.log_managing.core;

import java.util.Optional;

public interface ExecutionContextManager {
    void enterScope(String executionId, LogElementTracker tracker);
    void appendLine(String executionId, ParsedLogLine line, long offset);
    Optional<LogElementTracker> exitScope(String executionId);
}
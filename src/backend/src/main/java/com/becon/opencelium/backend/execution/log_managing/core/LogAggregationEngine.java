package com.becon.opencelium.backend.execution.log_managing.core;

public interface LogAggregationEngine {
    void processLine(String executionId, String rawLine);
}

package com.becon.opencelium.backend.execution.logger.aggregation;

public interface LogAggregationEngine {
    void processLine(String executionId, String rawLine);
}

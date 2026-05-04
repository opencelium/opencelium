package com.becon.opencelium.backend.execution.logger.pubsub.event;

public sealed interface ExecutionEvent permits
        ExecutionStartedEvent,
        ExecutionLogAppendedEvent,
        ExecutionFinishedEvent {
    long executionId();
}

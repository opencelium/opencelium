package com.becon.opencelium.backend.execution.logger.pubsub.event;

public record ExecutionStartedEvent(
        long executionId,
        long connectionId,
        int schedulerId,
        String timestamp
) implements ExecutionEvent {
}
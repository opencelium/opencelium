package com.becon.opencelium.backend.execution.logger.pubsub.event;

public record ExecutionLogAppendedEvent(
        long executionId,
        long startOffset,
        long endOffset
) implements ExecutionEvent {
    public ExecutionLogAppendedEvent {
        if (startOffset < 0 || endOffset < startOffset) {
            throw new IllegalArgumentException("Invalid offsets: start=" + startOffset + ", end=" + endOffset);
        }
    }
}

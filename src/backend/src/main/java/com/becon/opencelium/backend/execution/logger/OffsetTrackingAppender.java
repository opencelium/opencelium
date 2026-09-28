package com.becon.opencelium.backend.execution.logger;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.becon.opencelium.backend.execution.logger.pubsub.ExecutionEventPublisher;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionLogAppendedEvent;

import java.util.concurrent.atomic.AtomicLong;

public class OffsetTrackingAppender extends FileAppender<ILoggingEvent> {
    private final long executionId;
    private final AtomicLong offset = new AtomicLong();

    public OffsetTrackingAppender(long executionId) {
        this.executionId = executionId;
    }

    @Override
    protected void subAppend(ILoggingEvent event) {
        byte[] bytes = encoder.encode(event);

        long startOffset = offset.get();
        super.subAppend(event);
        long endOffset = offset.addAndGet(bytes.length);

        ExecutionEventPublisher.publish(
                new ExecutionLogAppendedEvent(
                        executionId,
                        startOffset,
                        endOffset
                )
        );
    }
}

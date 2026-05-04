package com.becon.opencelium.backend.execution.logger.pubsub.transport;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;

import java.util.function.Consumer;

public abstract class AbstractExecutionEventTransport implements ExecutionEventTransport {
    private Consumer<ExecutionEvent> consumer;

    @Override
    public final void setConsumer(Consumer<ExecutionEvent> consumer) {
        this.consumer = consumer;
    }

    public final void consume(ExecutionEvent event) {
        if (consumer != null) {
            consumer.accept(event);
        }
    }
}

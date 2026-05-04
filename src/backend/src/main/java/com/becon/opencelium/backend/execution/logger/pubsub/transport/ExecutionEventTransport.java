package com.becon.opencelium.backend.execution.logger.pubsub.transport;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;

import java.util.function.Consumer;

public interface ExecutionEventTransport {
    void accept(ExecutionEvent event);
    void setConsumer(Consumer<ExecutionEvent> consumer);
}

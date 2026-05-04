package com.becon.opencelium.backend.execution.logger.pubsub;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.transport.ExecutionEventTransport;

public class ExecutionEventPublisher {
    private static volatile ExecutionEventTransport transport;

    private ExecutionEventPublisher() {
    }

    static void init(ExecutionEventTransport transport) {
        ExecutionEventPublisher.transport = transport;
    }

    public static void publish(ExecutionEvent event) {
        if (transport == null) {
            throw new IllegalStateException("ExecutionEventTransport not initialized");
        }

        transport.accept(event);
    }
}

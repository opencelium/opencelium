package com.becon.opencelium.backend.execution.logger.pubsub;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.transport.ExecutionEventTransport;

public class ExecutionEventPublisher {
    private static volatile ExecutionEventTransport transport;

    private ExecutionEventPublisher() {
    }

    static void init(ExecutionEventTransport transport) {
        if (transport == null) {
            throw new IllegalStateException("ExecutionEventTransport is null");
        }

        ExecutionEventPublisher.transport = transport;
    }

    public static void publish(ExecutionEvent event) {
        ExecutionEventTransport current = transport;
        if (current == null) {
            throw new IllegalStateException("Execution event pipeline is not initialized");
        }

        current.accept(event);
    }

    static void clear() {
        transport = null;
    }
}

package com.becon.opencelium.backend.execution.logger.pubsub.transport;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;

public interface ExecutionEventTransport {
    void start();
    void accept(ExecutionEvent event);
    void stop();
}

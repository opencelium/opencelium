package com.becon.opencelium.backend.execution.logger.pubsub.handler;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;

public interface ExecutionEventHandler {
    boolean supports(ExecutionEvent event);
    void handle(ExecutionEvent event);
}

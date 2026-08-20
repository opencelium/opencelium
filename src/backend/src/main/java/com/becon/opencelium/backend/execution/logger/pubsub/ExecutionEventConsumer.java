package com.becon.opencelium.backend.execution.logger.pubsub;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.handler.ExecutionEventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExecutionEventConsumer {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionEventConsumer.class);

    private final List<ExecutionEventHandler> handlers;

    public ExecutionEventConsumer(List<ExecutionEventHandler> handlers) {
        this.handlers = List.copyOf(handlers);
    }

    public void dispatch(ExecutionEvent event) {
        for (ExecutionEventHandler handler : handlers) {
            if (!handler.supports(event)) {
                continue;
            }

            try {
                handler.handle(event);
            } catch (Exception e) {
                // isolate handlers from each other: one failing handler must not
                // prevent the remaining handlers from seeing the event
                logger.error("Handler {} failed for event {}", handler.getClass().getSimpleName(), event, e);
            }
        }
    }
}

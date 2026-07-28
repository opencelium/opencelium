package com.becon.opencelium.backend.execution.logger.pubsub;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.handler.ExecutionEventHandler;
import com.becon.opencelium.backend.execution.logger.pubsub.transport.ExecutionEventTransport;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExecutionEventConsumer {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionEventConsumer.class);

    private final List<ExecutionEventHandler> handlers;
    private final ExecutionEventTransport transport;

    public ExecutionEventConsumer(List<ExecutionEventHandler> handlers, ExecutionEventTransport transport) {
        this.handlers = handlers;
        this.transport = transport;
    }

    @PostConstruct
    public void init() {
        transport.setConsumer(this::dispatch);
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

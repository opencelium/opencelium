package com.becon.opencelium.backend.execution.logger.pubsub;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.handler.ExecutionEventHandler;
import com.becon.opencelium.backend.execution.logger.pubsub.transport.ExecutionEventTransport;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExecutionEventConsumer {
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
            if (handler.supports(event)) {
                handler.handle(event);
            }
        }
    }
}

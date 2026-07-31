package com.becon.opencelium.backend.execution.logger.pubsub;

import com.becon.opencelium.backend.execution.logger.pubsub.transport.ExecutionEventTransport;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

@Component
public class ExecutionEventPipeline {
    private final ExecutionEventTransport transport;

    public ExecutionEventPipeline(ExecutionEventTransport transport) {
        this.transport = transport;
    }

    @PostConstruct
    void start() {
        transport.start();
        ExecutionEventPublisher.init(transport);
    }

    @PreDestroy
    void stop() {
        ExecutionEventPublisher.clear();
        transport.stop();
    }
}

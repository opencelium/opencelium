package com.becon.opencelium.backend.execution.logger.pubsub;

import com.becon.opencelium.backend.execution.logger.pubsub.transport.ExecutionEventTransport;
import org.springframework.stereotype.Component;

@Component
public class ExecutionEventPublisherInitializer {
    public ExecutionEventPublisherInitializer(ExecutionEventTransport transpor) {
        ExecutionEventPublisher.init(transpor);
    }
}

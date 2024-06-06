package com.becon.opencelium.backend.gc.base.strategy;

import com.becon.opencelium.backend.configuration.ApplicationContextProvider;
import com.becon.opencelium.backend.gc.base.RunGCEvent;
import com.becon.opencelium.backend.gc.connection.ConnectionForGC;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;

public class OnApplicationReadyTriggerStrategy<T> implements GCTriggerStrategy {
    private final ApplicationEventPublisher applicationEventPublisher;

    public OnApplicationReadyTriggerStrategy() {
        applicationEventPublisher = ApplicationContextProvider.getApplicationContext();
    }

    @Override
    @EventListener(ApplicationReadyEvent.class)
    public void startTrigger() {
        applicationEventPublisher.publishEvent(new RunGCEvent<T>(new ConnectionForGC()));
    }

    @Override
    public void shutdown() {}
}

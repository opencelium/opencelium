package com.becon.opencelium.backend.gc.base.strategy;

import com.becon.opencelium.backend.configuration.ApplicationContextProvider;
import com.becon.opencelium.backend.gc.base.RunGCEvent;
import com.becon.opencelium.backend.gc.connection.ConnectionForGC;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.web.servlet.context.AnnotationConfigServletWebServerApplicationContext;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.context.support.AbstractApplicationContext;
import org.springframework.scheduling.concurrent.CustomizableThreadFactory;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.Date;

public class PeriodicTriggerStrategy<T> implements GCTriggerStrategy {
    private final long fixedDelay;
    private final long initialDelay;
    private static final long DEFAULT_FIXED_DELAY = 100_000; //milliseconds
    private static final long DEFAULT_INITIAL_DELAY = 100_000; //milliseconds
    private final ApplicationEventPublisher applicationEventPublisher;
    private final ThreadPoolTaskScheduler taskScheduler;

    public PeriodicTriggerStrategy(long fixedDelay, long initialDelay) {
        if (fixedDelay >= 0) {
            this.fixedDelay = fixedDelay;
        } else {
            this.fixedDelay = DEFAULT_FIXED_DELAY;
        }
        if (initialDelay >= 0) {
            this.initialDelay = initialDelay;
        } else {
            this.initialDelay = DEFAULT_INITIAL_DELAY;
        }
        taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(2);
        taskScheduler.initialize();
        taskScheduler.setThreadFactory(new CustomizableThreadFactory("GarbageCollector[Connection]-"));

        applicationEventPublisher = ApplicationContextProvider.getApplicationContext();
    }

    public PeriodicTriggerStrategy() {
        this(DEFAULT_FIXED_DELAY, DEFAULT_INITIAL_DELAY);
    }

    @Override
    public void startTrigger() {
        taskScheduler.scheduleWithFixedDelay(
                () -> applicationEventPublisher.publishEvent(new RunGCEvent<T>(new ConnectionForGC())),
                new Date(System.currentTimeMillis() + initialDelay),
                fixedDelay);
    }

    @Override
    public void shutdown() {
        taskScheduler.shutdown();
    }
}

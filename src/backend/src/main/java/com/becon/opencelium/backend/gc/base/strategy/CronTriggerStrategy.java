package com.becon.opencelium.backend.gc.base.strategy;

import com.becon.opencelium.backend.configuration.ApplicationContextProvider;
import com.becon.opencelium.backend.gc.base.RunGCEvent;
import com.becon.opencelium.backend.gc.connection.ConnectionForGC;
import org.quartz.CronExpression;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;

import java.text.ParseException;
import java.time.Clock;

public class CronTriggerStrategy<T> implements GCTriggerStrategy {
    private String cron;
    private static final String DEFAULT_CRON = "0 0/1 * * * ?"; //fires every 1 minute
    private final ApplicationEventPublisher applicationEventPublisher;
    private final ThreadPoolTaskScheduler taskScheduler;

    public CronTriggerStrategy(String cron) {
        try {
            new CronTrigger(cron, Clock.systemDefaultZone().getZone());
            this.cron = cron;
        } catch (Exception e) {
            this.cron = DEFAULT_CRON;
        }

        taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(2);
        taskScheduler.initialize();

        applicationEventPublisher = ApplicationContextProvider.getApplicationContext();
    }

    @Override
    public void startTrigger() {
        taskScheduler
                .schedule(
                        () -> applicationEventPublisher.publishEvent(new RunGCEvent<T>(new ConnectionForGC())),
                        new CronTrigger(cron, Clock.systemDefaultZone().getZone()));
    }

    @Override
    public void shutdown() {
        taskScheduler.shutdown();
    }
}

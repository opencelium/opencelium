package com.becon.opencelium.backend.subscription.remoteapi;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class InvokerSyncScheduler {

    @Scheduled(cron = "${opencelium.online_services.invoker_sync.time}")
    public void myTask() {
        System.out.println("Running task at");
    }
}

package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class InvokerSyncScheduler {
    private final RemoteApi remoteApi;
    private final InvokerSyncService invokerSyncService;

    public InvokerSyncScheduler(InvokerSyncService invokerSyncService) {
        this.remoteApi = RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL);
        this.invokerSyncService = invokerSyncService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void precalculateHmacs() {
        System.out.println("Application is fully ready");
    }

    @Scheduled(cron = "${opencelium.online_services.invoker_sync.time}")
    public void myTask() {
        System.out.println("Running task at");
    }
}

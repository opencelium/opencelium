package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.api.TemplateSyncService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

@Configuration
public class OnlineServicesSchedulerConfiguration implements SchedulingConfigurer {
    @Value("${opencelium.online_services.active:false}")
    private boolean active;

    @Value("${opencelium.online_services.invoker_sync.active:false}")
    private boolean invokerSyncActive;

    @Value("${opencelium.online_services.invoker_sync.time:-}")
    private String invokerSyncTime;

    @Value("${opencelium.online_services.template_sync.active:false}")
    private boolean templateSyncActive;

    @Value("${opencelium.online_services.template_sync.time:-}")
    private String templateSyncTime;

    private final InvokerSyncService invokerSyncService;
    private final TemplateSyncService templateSyncService;

    public OnlineServicesSchedulerConfiguration(
            InvokerSyncService invokerSyncService,
            TemplateSyncService templateSyncService
    ) {
        this.invokerSyncService = invokerSyncService;
        this.templateSyncService = templateSyncService;
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar registrar) {
        if (active) {
            scheduleIfEnabled(registrar, invokerSyncActive, invokerSyncTime, invokerSyncService::syncInvokers);
            scheduleIfEnabled(registrar, templateSyncActive, templateSyncTime, templateSyncService::syncTemplates);
        }
    }

    private void scheduleIfEnabled(ScheduledTaskRegistrar registrar, boolean enabled, String cron, Runnable task) {
        if (enabled && cron != null && !"-".equals(cron)) {
            registrar.addCronTask(task, cron);
        }
    }
}

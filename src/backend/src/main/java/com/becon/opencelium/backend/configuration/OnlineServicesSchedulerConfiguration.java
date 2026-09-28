package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.api.TemplateSyncService;
import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

@Configuration
public class OnlineServicesSchedulerConfiguration implements SchedulingConfigurer {

    private final OnlineServicesProps onlineServicesProps;
    private final InvokerSyncService invokerSyncService;
    private final TemplateSyncService templateSyncService;

    public OnlineServicesSchedulerConfiguration(
            OnlineServicesProps onlineServicesProps,
            InvokerSyncService invokerSyncService,
            TemplateSyncService templateSyncService
    ) {
        this.onlineServicesProps = onlineServicesProps;
        this.invokerSyncService = invokerSyncService;
        this.templateSyncService = templateSyncService;
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar registrar) {
        if (!onlineServicesProps.isServiceActive()) {
            return;
        }
        OnlineServicesProps.InvokerSync invokerSync = onlineServicesProps.getInvokerSync();
        if (invokerSync != null) {
            scheduleIfEnabled(registrar, invokerSync.getActive(), invokerSync.getTime(), invokerSyncService::syncInvokers);
        }
        OnlineServicesProps.TemplateSync templateSync = onlineServicesProps.getTemplateSync();
        if (templateSync != null) {
            scheduleIfEnabled(registrar, templateSync.getActive(), templateSync.getTime(), templateSyncService::syncTemplates);
        }
    }

    private void scheduleIfEnabled(ScheduledTaskRegistrar registrar, Boolean enabled, String cron, Runnable task) {
        if (Boolean.TRUE.equals(enabled) && cron != null && !"-".equals(cron)) {
            registrar.addCronTask(task, cron);
        }
    }
}

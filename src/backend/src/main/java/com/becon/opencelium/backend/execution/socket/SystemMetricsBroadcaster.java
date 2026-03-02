package com.becon.opencelium.backend.execution.socket;

import com.becon.opencelium.backend.database.mysql.service.WidgetService;
import com.becon.opencelium.backend.resource.application.SystemMetricsDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SystemMetricsBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(SystemMetricsBroadcaster.class);

    private final WidgetService widgetService;
    private final WebSocketNotificationService notificationService;
    private final WebSocketUserSubscriptionRegistry subscriptionRegistry;

    public SystemMetricsBroadcaster(
            WidgetService widgetService,
            WebSocketNotificationService notificationService,
            WebSocketUserSubscriptionRegistry subscriptionRegistry
    ) {
        this.widgetService = widgetService;
        this.notificationService = notificationService;
        this.subscriptionRegistry = subscriptionRegistry;
    }

    @Scheduled(fixedRate = 10_000)
    public void broadcast() {
        if (!subscriptionRegistry.hasSubscription(SocketConstant.SYSTEM_METRICS_DESTINATION)) {
            return;
        }

        try {
            SystemMetricsDTO metrics = widgetService.getSystemMetrics();
            notificationService.send(SocketConstant.SYSTEM_METRICS_DESTINATION, metrics);
        } catch (Exception e) {
            log.error("Failed to broadcast system metrics", e);
        }
    }
}

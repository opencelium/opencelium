/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.scheduler;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Periodic sweep that health-checks every connector's remote API in the background.
 *
 * <p>Each sweep loads all connectors and submits one check per connector to a dedicated
 * bounded executor, so slow remotes never block the scheduler thread. The connector list
 * is shuffled per sweep and the bounded pool staggers the actual request start times,
 * which spreads the load on the remote systems (start jitter). Requests honor each
 * connector's own {@code timeout}. Flap damping and persistence live in
 * {@link ConnectorHealthService#runCheck}.
 */
@Component
public class ConnectorHealthMonitor {

    private static final Logger log = LoggerFactory.getLogger(ConnectorHealthMonitor.class);

    private final ConnectorService connectorService;
    private final ConnectorHealthService connectorHealthService;
    private final ThreadPoolTaskExecutor executor;
    private final boolean enabled;

    public ConnectorHealthMonitor(
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            ConnectorHealthService connectorHealthService,
            @Qualifier("connectorHealthTaskExecutor") ThreadPoolTaskExecutor executor,
            @Value("${" + AppYamlPath.CONNECTOR_HEALTH_ENABLED + ":true}") boolean enabled
    ) {
        this.connectorService = connectorService;
        this.connectorHealthService = connectorHealthService;
        this.executor = executor;
        this.enabled = enabled;
    }

    @Scheduled(
            fixedDelayString = "${" + AppYamlPath.CONNECTOR_HEALTH_INTERVAL + ":300000}",
            initialDelayString = "${" + AppYamlPath.CONNECTOR_HEALTH_INITIAL_DELAY + ":60000}"
    )
    public void sweep() {
        if (!enabled) {
            return;
        }
        List<Connector> connectors;
        try {
            // findAll decrypts every connector's request data; if any row cannot be
            // decrypted the sweep is skipped entirely and statuses stay as they are.
            connectors = new ArrayList<>(connectorService.findAll());
        } catch (RuntimeException e) {
            log.warn("Connector health sweep skipped: connectors could not be loaded - {}", e.getMessage(), e);
            return;
        }
        Collections.shuffle(connectors);
        connectors.forEach(connector -> executor.execute(() -> connectorHealthService.runCheck(connector)));
        log.debug("Connector health sweep submitted {} checks", connectors.size());
    }
}

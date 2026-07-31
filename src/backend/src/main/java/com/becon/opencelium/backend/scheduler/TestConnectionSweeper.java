/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.scheduler;

import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectionServiceImp.CleanupResult;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Periodic sweeper that permanently removes leftover <em>test</em> connections.
 */
@Component
public class TestConnectionSweeper {
    private static final Logger log = LoggerFactory.getLogger(TestConnectionSweeper.class);

    private final ConnectionService connectionService;
    private final SchedulerService schedulerService;
    private final boolean enabled;

    public TestConnectionSweeper(
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Value("${opencelium.sweeper.test-connection.enabled:true}") boolean enabled
    ) {
        this.connectionService = connectionService;
        this.schedulerService = schedulerService;
        this.enabled = enabled;
    }

    @Scheduled(
            fixedDelayString = "${opencelium.sweeper.test-connection.fixed-delay:900000}",
            initialDelayString = "${opencelium.sweeper.test-connection.initial-delay:0}"
    )
    public void sweep() {
        if (!enabled) {
            return;
        }
        Set<Long> running = schedulerService.getRunningConnectionIds();
        CleanupResult result = connectionService.cleanupAllTestConnections(running);
        log.info(
                "Test connection sweep completed: candidates={}, mongoDeleted={}, sqlDeleted={}",
                result.candidateSqlIds(),
                result.mongoDeleted(),
                result.sqlDeleted()
        );
    }
}

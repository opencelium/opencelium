/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.scheduler;

import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectionServiceImp.CleanupResult;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.scheduler.TestConnectionSweeper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestConnectionSweeperTest {

    @Mock
    private ConnectionService connectionService;

    @Mock
    private SchedulerService schedulerService;

    @Test
    void sweepDelegatesToCleanupWithRunningIds() {
        // GIVEN two tests are currently running
        Set<Long> running = Set.of(100L, 101L);
        when(schedulerService.getRunningConnectionIds()).thenReturn(running);
        when(connectionService.cleanupAllTestConnections(running)).thenReturn(new CleanupResult(3, 3, 3));

        // WHEN the scheduled sweep fires
        new TestConnectionSweeper(connectionService, schedulerService, true).sweep();

        // THEN cleanup runs with exactly the running-ids guard, so active tests are never deleted
        verify(schedulerService).getRunningConnectionIds();
        verify(connectionService).cleanupAllTestConnections(running);
    }

    @Test
    void sweepDoesNothingWhenDisabled() {
        new TestConnectionSweeper(connectionService, schedulerService, false).sweep();

        verifyNoInteractions(connectionService, schedulerService);
    }
}

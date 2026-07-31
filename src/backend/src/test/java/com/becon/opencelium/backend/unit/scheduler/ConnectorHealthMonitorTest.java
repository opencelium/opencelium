/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.scheduler;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.scheduler.ConnectorHealthMonitor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ConnectorHealthMonitor}.
 *
 * The executor mock runs submitted tasks inline, so no threads, sleeps, or
 * Awaitility polling are needed. Pinned contract: a disabled monitor never
 * touches any collaborator; an enabled sweep submits exactly one
 * {@code runCheck} per connector; a sweep whose connector load fails (e.g.
 * credential decryption error) is skipped without submitting anything.
 *
 * Run with: ./gradlew test --tests "*.ConnectorHealthMonitorTest"
 */
@ExtendWith(MockitoExtension.class)
class ConnectorHealthMonitorTest {

    @Mock
    private ConnectorService connectorService;

    @Mock
    private ConnectorHealthService connectorHealthService;

    @Mock
    private ThreadPoolTaskExecutor executor;

    @Test
    void sweepDoesNothingWhenDisabled() {
        ConnectorHealthMonitor monitor = new ConnectorHealthMonitor(
                connectorService, connectorHealthService, executor, false);

        monitor.sweep();

        verifyNoInteractions(connectorService, connectorHealthService, executor);
    }

    @Test
    void sweepSubmitsOneCheckPerConnectorWhenEnabled() {
        Connector first = aConnector(1);
        Connector second = aConnector(2);
        when(connectorService.findAll()).thenReturn(List.of(first, second));
        doAnswer(invocation -> {
            invocation.getArgument(0, Runnable.class).run();
            return null;
        }).when(executor).execute(any(Runnable.class));
        ConnectorHealthMonitor monitor = new ConnectorHealthMonitor(
                connectorService, connectorHealthService, executor, true);

        monitor.sweep();

        verify(connectorHealthService).runCheck(first);
        verify(connectorHealthService).runCheck(second);
    }

    @Test
    void sweepSubmitsNothingWhenConnectorsCannotBeLoaded() {
        when(connectorService.findAll()).thenThrow(new RuntimeException("decryption failed"));
        ConnectorHealthMonitor monitor = new ConnectorHealthMonitor(
                connectorService, connectorHealthService, executor, true);

        monitor.sweep();

        verifyNoInteractions(connectorHealthService, executor);
    }

    private static Connector aConnector(int id) {
        Connector connector = new Connector();
        connector.setId(id);
        connector.setTitle("connector-" + id);
        connector.setInvoker("Invoker");
        return connector;
    }
}

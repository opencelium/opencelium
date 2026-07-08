/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the test-connection helpers on {@link ConnectionServiceImp}:
 * {@code filterTestConnections}, {@code filterTestConnectionEntities} and {@code deleteByIds}.
 *
 * Run with: ./gradlew test --tests "*.ConnectionServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
class ConnectionServiceImpTest {

    private static final String TEST_TITLE = "!*test_connection_1700000000000_Demo";
    private static final String OTHER_TEST_TITLE = "!*test_connection_1700000000001_Other";
    private static final String NORMAL_TITLE = "Regular connection";

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private ConnectionMngServiceImp connectionMngService;

    private ConnectionServiceImp connectionService;

    @BeforeEach
    void setUp() {
        // The constructor calls entityVersionManager.getUpdater(...), so it cannot be left null;
        // construct with the collaborators these tests exercise and a mock version manager for the rest.
        EntityVersionManager entityVersionManager = mock(EntityVersionManager.class);
        connectionService = new ConnectionServiceImp(
                connectionRepository, null, connectionMngService, null, null, null, null, null,
                null, null, null, null, null, null, entityVersionManager, null, null);
    }

    // ── findAll(includeTest) ──────────────────────────────────────────────────

    @Test
    void findAllIncludesEveryConnectionWhenIncludeTestTrue() {
        when(connectionRepository.findAll())
                .thenReturn(List.of(entity(1L, NORMAL_TITLE), entity(2L, TEST_TITLE)));

        List<Connection> result = connectionService.findAll(true);

        assertThat(result).extracting(Connection::getTitle)
                .containsExactlyInAnyOrder(NORMAL_TITLE, TEST_TITLE);
    }

    @Test
    void findAllExcludesTestConnectionsWhenIncludeTestFalse() {
        when(connectionRepository.findAll())
                .thenReturn(List.of(entity(1L, NORMAL_TITLE), entity(2L, TEST_TITLE)));

        List<Connection> result = connectionService.findAll(false);

        assertThat(result).extracting(Connection::getTitle).containsExactly(NORMAL_TITLE);
    }

    @Test
    void findAllIncludesTestConnectionsRegardlessOfRunningStateWhenIncludeTestTrue() {
        // Running state must NOT affect listing: includeTest=true returns all test connections.
        when(connectionRepository.findAll())
                .thenReturn(List.of(entity(5L, TEST_TITLE), entity(6L, OTHER_TEST_TITLE)));

        List<Connection> result = connectionService.findAll(true);

        assertThat(result).extracting(Connection::getTitle)
                .containsExactlyInAnyOrder(TEST_TITLE, OTHER_TEST_TITLE);
    }

    @Test
    void findAllReturnsEmptyWhenRepositoryEmpty() {
        when(connectionRepository.findAll()).thenReturn(List.of());

        assertThat(connectionService.findAll(false)).isEmpty();
    }

    // ── findAllByConnectorId(includeTest) ─────────────────────────────────────

    @Test
    void findAllByConnectorIdExcludesTestConnectionsWhenIncludeTestFalse() {
        when(connectionRepository.findAllByConnectorId(7))
                .thenReturn(new LinkedList<>(List.of(entity(1L, NORMAL_TITLE), entity(2L, TEST_TITLE))));

        List<Connection> result = connectionService.findAllByConnectorId(7, false);

        assertThat(result).extracting(Connection::getTitle).containsExactly(NORMAL_TITLE);
    }

    @Test
    void findAllByConnectorIdKeepsTestConnectionsWhenIncludeTestTrue() {
        when(connectionRepository.findAllByConnectorId(7))
                .thenReturn(new LinkedList<>(List.of(entity(1L, NORMAL_TITLE), entity(2L, TEST_TITLE))));

        List<Connection> result = connectionService.findAllByConnectorId(7, true);

        assertThat(result).extracting(Connection::getTitle)
                .containsExactlyInAnyOrder(NORMAL_TITLE, TEST_TITLE);
    }

    // ── deleteByIds ───────────────────────────────────────────────────────────

    @Test
    void deleteByIdsDeletesExistingNonRunningConnections() {
        when(connectionRepository.findById(1L)).thenReturn(Optional.of(entity(1L, NORMAL_TITLE)));
        when(connectionRepository.findById(2L)).thenReturn(Optional.of(entity(2L, TEST_TITLE)));

        connectionService.deleteByIds(List.of(1L, 2L), Set.of());

        verify(connectionRepository).deleteById(1L);
        verify(connectionRepository).deleteById(2L);
    }

    @Test
    void deleteByIdsSkipsRunningTestConnection() {
        when(connectionRepository.findById(5L)).thenReturn(Optional.of(entity(5L, TEST_TITLE)));

        connectionService.deleteByIds(List.of(5L), Set.of(5L));

        verify(connectionRepository, never()).deleteById(5L);
        verify(connectionMngService, never()).deleteAllByConnectionId(5L);
    }

    @Test
    void deleteByIdsDeletesRunningNonTestConnection() {
        when(connectionRepository.findById(5L)).thenReturn(Optional.of(entity(5L, NORMAL_TITLE)));

        connectionService.deleteByIds(List.of(5L), Set.of(5L));

        verify(connectionRepository).deleteById(5L);
    }

    @Test
    void deleteByIdsSkipsAlreadyRemovedId() {
        when(connectionRepository.findById(9L)).thenReturn(Optional.empty());

        connectionService.deleteByIds(List.of(9L), Set.of());

        verify(connectionRepository, never()).deleteById(9L);
    }

    @Test
    void deleteByIdsDoesNothingWhenIdsEmpty() {
        connectionService.deleteByIds(List.of(), Set.of(1L));

        verifyNoInteractions(connectionRepository, connectionMngService);
    }

    @Test
    void deleteByIdsSkipsNullId() {
        connectionService.deleteByIds(java.util.Collections.singletonList(null), Set.of());

        verifyNoInteractions(connectionRepository, connectionMngService);
    }

    private static Connection entity(Long id, String title) {
        Connection connection = new Connection();
        connection.setId(id);
        connection.setTitle(title);
        return connection;
    }
}

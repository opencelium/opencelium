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
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    // ── filterTestConnections (List<ConnectionDTO>) ───────────────────────────

    @Test
    void filterTestConnectionsKeepsNonTestConnectionsWhenTestIsFalse() {
        List<ConnectionDTO> input = List.of(dto("1", NORMAL_TITLE));

        List<ConnectionDTO> result = connectionService.filterTestConnections(input, false, Set.of());

        assertThat(result).extracting(ConnectionDTO::getTitle).containsExactly(NORMAL_TITLE);
    }

    @Test
    void filterTestConnectionsExcludesTestConnectionsWhenTestIsFalse() {
        List<ConnectionDTO> input = List.of(dto("1", NORMAL_TITLE), dto("2", TEST_TITLE));

        List<ConnectionDTO> result = connectionService.filterTestConnections(input, false, Set.of());

        assertThat(result).extracting(ConnectionDTO::getTitle).containsExactly(NORMAL_TITLE);
    }

    @Test
    void filterTestConnectionsIncludesTestConnectionsWhenTestIsTrue() {
        List<ConnectionDTO> input = List.of(dto("1", NORMAL_TITLE), dto("2", TEST_TITLE));

        List<ConnectionDTO> result = connectionService.filterTestConnections(input, true, Set.of());

        assertThat(result).extracting(ConnectionDTO::getTitle)
                .containsExactlyInAnyOrder(NORMAL_TITLE, TEST_TITLE);
    }

    @Test
    void filterTestConnectionsExcludesRunningTestConnectionWhenTestIsTrue() {
        List<ConnectionDTO> input = List.of(dto("5", TEST_TITLE), dto("6", OTHER_TEST_TITLE));

        List<ConnectionDTO> result = connectionService.filterTestConnections(input, true, Set.of(5L));

        assertThat(result).extracting(ConnectionDTO::getTitle).containsExactly(OTHER_TEST_TITLE);
    }

    @Test
    void filterTestConnectionsReturnsEmptyWhenInputEmpty() {
        List<ConnectionDTO> result = connectionService.filterTestConnections(List.of(), true, Set.of(1L));

        assertThat(result).isEmpty();
    }

    // ── filterTestConnectionEntities (List<Connection>) ───────────────────────

    @Test
    void filterTestConnectionEntitiesKeepsNonTestConnectionsWhenTestIsFalse() {
        List<Connection> input = List.of(entity(1L, NORMAL_TITLE));

        List<Connection> result = connectionService.filterTestConnectionEntities(input, false, Set.of());

        assertThat(result).extracting(Connection::getTitle).containsExactly(NORMAL_TITLE);
    }

    @Test
    void filterTestConnectionEntitiesExcludesTestConnectionsWhenTestIsFalse() {
        List<Connection> input = List.of(entity(1L, NORMAL_TITLE), entity(2L, TEST_TITLE));

        List<Connection> result = connectionService.filterTestConnectionEntities(input, false, Set.of());

        assertThat(result).extracting(Connection::getTitle).containsExactly(NORMAL_TITLE);
    }

    @Test
    void filterTestConnectionEntitiesIncludesTestConnectionsWhenTestIsTrue() {
        List<Connection> input = List.of(entity(1L, NORMAL_TITLE), entity(2L, TEST_TITLE));

        List<Connection> result = connectionService.filterTestConnectionEntities(input, true, Set.of());

        assertThat(result).extracting(Connection::getTitle)
                .containsExactlyInAnyOrder(NORMAL_TITLE, TEST_TITLE);
    }

    @Test
    void filterTestConnectionEntitiesExcludesRunningTestConnectionWhenTestIsTrue() {
        List<Connection> input = List.of(entity(5L, TEST_TITLE), entity(6L, OTHER_TEST_TITLE));

        List<Connection> result = connectionService.filterTestConnectionEntities(input, true, Set.of(5L));

        assertThat(result).extracting(Connection::getTitle).containsExactly(OTHER_TEST_TITLE);
    }

    @Test
    void filterTestConnectionEntitiesReturnsEmptyWhenInputEmpty() {
        List<Connection> result = connectionService.filterTestConnectionEntities(List.of(), true, Set.of(1L));

        assertThat(result).isEmpty();
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

    private static ConnectionDTO dto(String id, String title) {
        ConnectionDTO dto = new ConnectionDTO();
        dto.setId(id);
        dto.setTitle(title);
        return dto;
    }

    private static Connection entity(Long id, String title) {
        Connection connection = new Connection();
        connection.setId(id);
        connection.setTitle(title);
        return connection;
    }
}

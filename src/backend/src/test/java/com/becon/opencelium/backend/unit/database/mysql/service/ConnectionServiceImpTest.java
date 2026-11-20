/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.container.ConnectionUpdateTracker;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.service.CategoryService;
import com.becon.opencelium.backend.database.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableUsageService;
import com.becon.opencelium.backend.database.mysql.service.ExecutionArgumentService;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.execution.globalvariable.TestRunOrigins;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.testutil.fixture.ConnectionMngFixture;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import com.github.fge.jsonpatch.JsonPatch;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the test-connection helpers on {@link ConnectionServiceImp}:
 * {@code filterTestConnections}, {@code filterTestConnectionEntities} and {@code deleteByIds},
 * and for what it does about global variable references when a workflow is deleted, switched to
 * another version or moved to another category by a full update, a patch or {@code updateCategory}.
 *
 * Run with: ./gradlew test --tests "*.ConnectionServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
class ConnectionServiceImpTest {

    private static final String TEST_TITLE = "!*test_connection_1700000000000_Demo";
    private static final String OTHER_TEST_TITLE = "!*test_connection_1700000000001_Other";
    private static final String NORMAL_TITLE = "Regular connection";
    // the patch helper is mocked, so what the patch holds does not matter
    private static final JsonPatch A_PATCH = new JsonPatch(List.of());

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private ConnectionMngServiceImp connectionMngService;

    @Mock
    private GlobalVariableUsageService globalVariableUsageService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private FieldBindingMngService fieldBindingMngService;

    @Mock
    private PatchHelper patchHelper;

    @Mock
    private Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;

    @Mock
    private Mapper<Connection, ConnectionDTO> connectionMapper;

    @Mock
    private ConnectionUpdateTracker updateTracker;

    @Mock
    private OpenceliumProps ocProps;

    private ConnectionServiceImp connectionService;

    @BeforeEach
    void setUp() {
        // The constructor calls entityVersionManager.getUpdater(...), so it cannot be left null;
        // construct with the collaborators these tests exercise and a mock version manager for the rest.
        // deleteById strips execution_argument rows, so executionArgumentService cannot be null either;
        // it also clears the global variable usages of the connection. A full update and a patch read the
        // category, the mappers, the patch helper, the update tracker and the version, hence the other mocks.
        EntityVersionManager entityVersionManager = mock(EntityVersionManager.class);
        ExecutionArgumentService executionArgumentService = mock(ExecutionArgumentService.class);
        connectionService = new ConnectionServiceImp(
                connectionRepository, null, connectionMngService, fieldBindingMngService, categoryService, null,
                null, null, patchHelper, null, connectionMngMapper, connectionMapper, updateTracker, null,
                executionArgumentService, entityVersionManager, ocProps, null, globalVariableUsageService,
                new TestRunOrigins());
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

    // ── global variable usages ────────────────────────────────────────────────

    @Test
    void deleteByIdClearsUsagesWhenConnectionIsDeleted() {
        when(connectionRepository.findById(1L)).thenReturn(Optional.of(entity(1L, NORMAL_TITLE)));

        connectionService.deleteById(1L);

        verify(globalVariableUsageService).deleteForWorkflow(1L);
        verify(connectionRepository).deleteById(1L);
    }

    @Test
    void updateCategoryChecksReferencesWhenWorkflowMoves() {
        Connection connection = entity(1L, NORMAL_TITLE);
        connection.setSnapshotId("snapshot-1");
        connection.setCategoryId(3);
        ConnectionMng content = new ConnectionMng();
        when(connectionMngService.getById("snapshot-1")).thenReturn(content);
        doThrow(new GlobalReferenceValidationException(List.of(new GlobalReferenceValidationException.Violation(
                GlobalReferenceValidationException.Code.OUT_OF_SCOPE, "outside the scope", "idoitUrl",
                "{{global.idoitUrl}}", "#ababab", "0_1", "endpoint"))))
                .when(globalVariableUsageService).checkWorkflowMove(content, 1L, 4);

        assertThatThrownBy(() -> connectionService.updateCategory(connection, 4))
                .isInstanceOf(GlobalReferenceValidationException.class)
                .hasMessageContaining("outside the scope");

        assertThat(connection.getCategoryId()).isEqualTo(3);
        verify(connectionRepository, never()).save(any());
    }

    @Test
    void updateCategorySavesNewCategoryWhenReferencesStayValid() {
        Connection connection = entity(1L, NORMAL_TITLE);
        connection.setSnapshotId("snapshot-1");
        ConnectionMng content = new ConnectionMng();
        when(connectionMngService.getById("snapshot-1")).thenReturn(content);

        connectionService.updateCategory(connection, 4);

        assertThat(connection.getCategoryId()).isEqualTo(4);
        verify(globalVariableUsageService).checkWorkflowMove(content, 1L, 4);
        verify(connectionRepository).save(connection);
    }

    @Test
    void switchVersionRebuildsUsagesWhenVersionChanges() {
        Connection connection = entity(1L, NORMAL_TITLE);
        connection.setSnapshotId("snapshot-1");
        ConnectionMng otherVersion = new ConnectionMng();
        otherVersion.setId("snapshot-2");
        when(connectionRepository.findById(1L)).thenReturn(Optional.of(connection));
        when(connectionMngService.getById("snapshot-2")).thenReturn(otherVersion);

        connectionService.switchVersion(1L, "snapshot-2");

        assertThat(connection.getSnapshotId()).isEqualTo("snapshot-2");
        verify(globalVariableUsageService).rebuildForWorkflow(1L, otherVersion);
    }

    // ── moving a workflow to another category ─────────────────────────────────

    @Test
    @DisplayName("update — a workflow that changes category has the notifications of its schedules checked with it")
    void updateChecksMoveWhenCategoryChanges() {
        givenStoredWorkflowInCategory(3);
        ConnectionMng content = ConnectionMngFixture.aWorkflowWith();
        when(connectionMngService.create(content)).thenReturn(new ConnectionMng());

        connectionService.update(aWorkflowUpdate(4), content);

        verify(globalVariableUsageService).checkWorkflowMove(content, 1L, 4);
        verify(globalVariableUsageService, never()).checkWorkflow(any(), any(), any());
    }

    @Test
    void updateChecksWorkflowOnlyWhenCategoryStaysSame() {
        givenStoredWorkflowInCategory(3);
        ConnectionMng content = ConnectionMngFixture.aWorkflowWith();
        when(connectionMngService.create(content)).thenReturn(new ConnectionMng());

        connectionService.update(aWorkflowUpdate(3), content);

        verify(globalVariableUsageService).checkWorkflow(content, 1L, 3);
        verify(globalVariableUsageService, never()).checkWorkflowMove(any(), anyLong(), any());
    }

    @Test
    @DisplayName("update — a refused move writes neither the new version to Mongo nor the workflow to MariaDB")
    void updateWritesNothingWhenMoveIsRefused() {
        givenStoredWorkflowInCategory(3);
        ConnectionMng content = ConnectionMngFixture.aWorkflowWith();
        doThrow(aNotificationRejection()).when(globalVariableUsageService).checkWorkflowMove(content, 1L, 4);

        assertThatThrownBy(() -> connectionService.update(aWorkflowUpdate(4), content))
                .isInstanceOf(GlobalReferenceValidationException.class)
                .hasMessageContaining("notification 'Failure mail' (schedule 'Nightly')");

        verify(connectionMngService, never()).create(any());
        verify(connectionMngService, never()).save(any());
        verify(connectionRepository, never()).save(any());
    }

    @Test
    void updateCategoryChecksWorkflowOnlyWhenCategoryStaysSame() {
        Connection connection = entity(1L, NORMAL_TITLE);
        connection.setSnapshotId("snapshot-1");
        connection.setCategoryId(3);
        ConnectionMng content = new ConnectionMng();
        when(connectionMngService.getById("snapshot-1")).thenReturn(content);

        connectionService.updateCategory(connection, 3);

        verify(globalVariableUsageService).checkWorkflow(content, 1L, 3);
        verify(globalVariableUsageService, never()).checkWorkflowMove(any(), anyLong(), any());
    }

    @Test
    @DisplayName("updateCategory — a workflow without content still has the notifications of its schedules checked")
    void updateCategoryChecksNotificationsWhenWorkflowHasNoSnapshot() {
        Connection connection = entity(1L, NORMAL_TITLE);
        connection.setCategoryId(3);

        connectionService.updateCategory(connection, 4);

        verify(globalVariableUsageService).checkWorkflowMove(null, 1L, 4);
        verifyNoInteractions(connectionMngService);
    }

    @Test
    @DisplayName("patchUpdate — a patch that moves the workflow is refused before anything is written")
    void patchUpdateWritesNothingWhenCategoryMoveIsRefused() {
        ConnectionMng patchedContent = givenPatchMovingWorkflow(3, 4);
        doThrow(aNotificationRejection()).when(globalVariableUsageService).checkWorkflowMove(patchedContent, 1L, 4);

        assertThatThrownBy(() -> connectionService.patchUpdate(1L, A_PATCH, null))
                .isInstanceOf(GlobalReferenceValidationException.class)
                .hasMessageContaining("notification 'Failure mail' (schedule 'Nightly')");

        verify(connectionRepository, never()).save(any());
        verify(connectionMngService, never()).save(any());
        verifyNoInteractions(updateTracker);
    }

    @Test
    @DisplayName("patchUpdate — a patch that keeps the category is saved without the checks of a move")
    void patchUpdateSkipsMoveCheckWhenCategoryStaysSame() {
        ConnectionMng patchedContent = givenPatchMovingWorkflow(3, 3);

        connectionService.patchUpdate(1L, A_PATCH, null);

        verify(globalVariableUsageService, never()).checkWorkflowMove(any(), anyLong(), any());
        verify(connectionMngService).save(patchedContent);
    }

    private static Connection entity(Long id, String title) {
        Connection connection = new Connection();
        connection.setId(id);
        connection.setTitle(title);
        return connection;
    }

    /** Stores workflow 1 with snapshot "snapshot-1" in the given category. */
    private void givenStoredWorkflowInCategory(Integer categoryId) {
        Connection stored = entity(1L, NORMAL_TITLE);
        stored.setSnapshotId("snapshot-1");
        stored.setCategoryId(categoryId);
        when(connectionRepository.findById(1L)).thenReturn(Optional.of(stored));
        when(connectionMngService.getById("snapshot-1")).thenReturn(ConnectionMngFixture.aWorkflowWith());
    }

    /** Workflow 1 as a full update sends it: same title, default connector, the given category. */
    private static Connection aWorkflowUpdate(Integer categoryId) {
        Connection connection = entity(1L, NORMAL_TITLE);
        connection.setFromConnector(ConnectionConstants.DEFAULT_CONNECTOR_ID);
        connection.setCategoryId(categoryId);
        return connection;
    }

    /**
     * Stores workflow 1 in category {@code from} and lets {@link #A_PATCH} put it in category
     * {@code to}.
     *
     * @return the content the patch saves to Mongo
     */
    private ConnectionMng givenPatchMovingWorkflow(Integer from, Integer to) {
        Connection stored = entity(1L, NORMAL_TITLE);
        stored.setSnapshotId("snapshot-1");
        stored.setCategoryId(from);
        ConnectionMng storedContent = new ConnectionMng();
        storedContent.setConnectionId(1L);
        when(connectionRepository.findById(1L)).thenReturn(Optional.of(stored));
        when(connectionMngService.getById("snapshot-1")).thenReturn(storedContent);
        when(connectionMngMapper.toDTO(storedContent)).thenReturn(new ConnectionDTO());
        when(connectionMapper.toDTO(stored)).thenReturn(aWorkflowDto(from));

        ConnectionDTO patched = aWorkflowDto(to);
        Connection patchedRow = entity(1L, NORMAL_TITLE);
        patchedRow.setCategoryId(to);
        ConnectionMng patchedContent = new ConnectionMng();
        when(patchHelper.patch(eq(A_PATCH), any(ConnectionDTO.class), eq(ConnectionDTO.class))).thenReturn(patched);
        when(connectionMapper.toEntity(patched)).thenReturn(patchedRow);
        when(connectionMngMapper.toEntity(patched)).thenReturn(patchedContent);
        return patchedContent;
    }

    private static ConnectionDTO aWorkflowDto(Integer categoryId) {
        ConnectionDTO dto = new ConnectionDTO();
        dto.setConnectionId(1L);
        dto.setTitle(NORMAL_TITLE);
        dto.setCategoryId(categoryId);
        return dto;
    }

    private static GlobalReferenceValidationException aNotificationRejection() {
        return new GlobalReferenceValidationException(List.of(new GlobalReferenceValidationException.Violation(
                GlobalReferenceValidationException.Code.OUT_OF_SCOPE,
                "The workflow of notification 'Failure mail' (schedule 'Nightly') is outside the scope of global"
                        + " variable 'supportUrl'",
                "supportUrl", "{{global.supportUrl}}", null, null, "en.body")));
    }
}

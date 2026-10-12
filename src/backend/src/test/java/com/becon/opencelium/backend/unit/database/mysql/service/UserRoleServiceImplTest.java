/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Component;
import com.becon.opencelium.backend.database.mysql.entity.Permission;
import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.repository.UserRoleRepository;
import com.becon.opencelium.backend.database.mysql.service.ComponentServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.PermissionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.exception.RoleExistsException;
import com.becon.opencelium.backend.exception.RoleNotFoundException;
import com.becon.opencelium.backend.resource.user.ComponentResource;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link UserRoleServiceImpl}.
 *
 * No Spring context is loaded. Repositories and collaborating services are
 * mocked with Mockito. Transaction boundaries and JPA orphan removal belong
 * in integration tests; these tests verify how the managed aggregate is
 * mutated inside those boundaries.
 *
 * Run with: ./gradlew test
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserRoleServiceImpl - unit")
class UserRoleServiceImplTest {

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private PermissionServiceImpl permissionService;

    @Mock
    private ComponentServiceImpl componentService;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private UserRoleServiceImpl userRoleService;

    // ── getById ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getById returns resource when role exists")
    void getByIdReturnsResourceWhenRoleExists() {
        // GIVEN
        UserRole role = UserRoleFixture.aStandardUserRole();

        when(userRoleRepository.findById(role.getId()))
                .thenReturn(Optional.of(role));

        // WHEN
        UserRoleResource result = userRoleService.getById(role.getId());

        // THEN
        assertThat(result.getGroupId()).isEqualTo(role.getId());
        assertThat(result.getName()).isEqualTo(role.getName());
        assertThat(result.getDescription()).isEqualTo(role.getDescription());
    }

    @Test
    @DisplayName("getById throws RoleNotFoundException when role does not exist")
    void getByIdThrowsWhenRoleDoesNotExist() {
        // GIVEN
        when(userRoleRepository.findById(99)).thenReturn(Optional.empty());

        // WHEN-THEN
        assertThatThrownBy(() -> userRoleService.getById(99))
                .isInstanceOf(RoleNotFoundException.class);
    }

    // ── getAll ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAll maps repository entities to resources")
    void getAllMapsEntitiesToResources() {
        // GIVEN
        UserRole user = UserRoleFixture.aStandardUserRole();
        UserRole admin = UserRoleFixture.anAdminRole();
        when(userRoleRepository.findAll()).thenReturn(List.of(user, admin));

        // WHEN
        List<UserRoleResource> result = userRoleService.getAll();

        // THEN
        assertThat(result)
                .extracting(UserRoleResource::getName)
                .containsExactly(user.getName(), admin.getName());
    }

    // ── existsByName / findByName ─────────────────────────────────────────────

    @Test
    @DisplayName("existsByName delegates to repository")
    void existsByNameDelegatesToRepository() {
        // GIVEN
        when(userRoleRepository.existsByName("ROLE_ADMIN")).thenReturn(true);

        // WHEN-THEN
        assertThat(userRoleService.existsByName("ROLE_ADMIN")).isTrue();
        verify(userRoleRepository).existsByName("ROLE_ADMIN");
    }

    @Test
    @DisplayName("findByName returns repository result")
    void findByNameReturnsRepositoryResult() {
        // GIVEN
        UserRole expected = UserRoleFixture.anAdminRole();

        when(userRoleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(expected));

        // WHEN-THEN
        assertThat(userRoleService.findByName("ROLE_ADMIN"))
                .containsSame(expected);
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create saves one aggregate with scalar fields and permissions")
    void createSavesOneAggregate() {
        // GIVEN
        UserRoleResource resource = roleResource("ROLE_USER", "User role", "user.png");
        resource.setComponents(List.of(componentResource(10, Set.of("READ", "WRITE"))));

        Component component = UserRoleFixture.aComponent(10, "CONNECTION");
        Permission read = UserRoleFixture.aPermission(100, "READ");
        Permission write = UserRoleFixture.aPermission(101, "WRITE");

        when(userRoleRepository.existsByName("ROLE_USER")).thenReturn(false);
        when(componentService.findById(10)).thenReturn(Optional.of(component));
        when(permissionService.findByName("READ")).thenReturn(Optional.of(read));
        when(permissionService.findByName("WRITE")).thenReturn(Optional.of(write));
        when(userRoleRepository.save(any(UserRole.class))).thenAnswer(invocation -> {
            UserRole saved = invocation.getArgument(0);
            saved.setId(4);
            return saved;
        });

        // WHEN
        UserRoleResource result = userRoleService.create(resource);

        // THEN
        ArgumentCaptor<UserRole> captor = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).save(captor.capture());

        UserRole saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("ROLE_USER");
        assertThat(saved.getDescription()).isEqualTo("User role");
        assertThat(saved.getIcon()).isEqualTo("user.png");
        assertThat(saved.getComponents()).hasSize(2);
        assertThat(saved.getComponents())
                .extracting(RoleHasPermission::getPermission)
                .containsExactlyInAnyOrder(read, write);
        assertThat(saved.getComponents())
                .extracting(RoleHasPermission::getUserRole)
                .containsOnly(saved);
        assertThat(result.getGroupId()).isEqualTo(4);
    }

    @Test
    @DisplayName("create throws RoleExistsException without saving when name exists")
    void createThrowsWhenNameExists() {
        // GIVEN
        UserRoleResource resource = roleResource("ROLE_ADMIN", "Administrator", null);
        when(userRoleRepository.existsByName("ROLE_ADMIN")).thenReturn(true);

        // WHEN-THEN
        assertThatThrownBy(() -> userRoleService.create(resource))
                .isInstanceOf(RoleExistsException.class);

        verify(userRoleRepository, never()).save(any(UserRole.class));
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update mutates managed scalar fields without explicitly saving")
    void updateMutatesManagedScalarFields() {
        // GIVEN
        UserRole role = UserRoleFixture.aStandardUserRole();
        UserRoleResource resource = roleResource("ROLE_MEMBER", "Member role", "member.png");

        when(userRoleRepository.findById(role.getId())).thenReturn(Optional.of(role));
        when(userRoleRepository.existsByName("ROLE_MEMBER")).thenReturn(false);

        // WHEN
        UserRoleResource result = userRoleService.update(role.getId(), resource);

        // THEN
        assertThat(role.getName()).isEqualTo("ROLE_MEMBER");
        assertThat(role.getDescription()).isEqualTo("Member role");
        assertThat(role.getIcon()).isEqualTo("member.png");
        assertThat(result.getName()).isEqualTo("ROLE_MEMBER");

        // The entity is managed by the transaction; JPA dirty checking persists it.
        verify(userRoleRepository, never()).save(any(UserRole.class));
    }

    @Test
    @DisplayName("update throws RoleExistsException when another role has requested name")
    void updateThrowsWhenAnotherRoleHasRequestedName() {
        // GIVEN
        UserRole role = UserRoleFixture.aStandardUserRole();
        UserRoleResource resource = roleResource("ROLE_ADMIN", "Administrator", null);

        when(userRoleRepository.findById(role.getId())).thenReturn(Optional.of(role));
        when(userRoleRepository.existsByName("ROLE_ADMIN")).thenReturn(true);

        // WHEN-THEN
        assertThatThrownBy(() -> userRoleService.update(role.getId(), resource))
                .isInstanceOf(RoleExistsException.class);
    }

    // ── updateComponents ──────────────────────────────────────────────────────

    @Test
    @DisplayName("updateComponents keeps requested links, removes obsolete links and adds new links")
    void updateComponentsReconcilesManagedCollection() {
        // GIVEN
        UserRole role = UserRoleFixture.aStandardUserRole();
        Component component = UserRoleFixture.aComponent(10, "CONNECTION");
        Permission read = UserRoleFixture.aPermission(100, "READ");
        Permission delete = UserRoleFixture.aPermission(101, "DELETE");
        Permission write = UserRoleFixture.aPermission(102, "WRITE");

        role.addPermission(component, read);
        role.addPermission(component, delete);

        UserRoleResource resource = new UserRoleResource();
        resource.setComponents(List.of(componentResource(10, Set.of("READ", "WRITE"))));

        when(userRoleRepository.findById(role.getId())).thenReturn(Optional.of(role));
        when(componentService.findById(10)).thenReturn(Optional.of(component));
        when(permissionService.findByName("READ")).thenReturn(Optional.of(read));
        when(permissionService.findByName("WRITE")).thenReturn(Optional.of(write));

        // WHEN
        userRoleService.updateComponents(role.getId(), resource);

        // THEN
        assertThat(role.getComponents()).hasSize(2);
        assertThat(role.getComponents())
                .extracting(RoleHasPermission::getPermission)
                .containsExactlyInAnyOrder(read, write);
        assertThat(component.getPermissions())
                .extracting(RoleHasPermission::getPermission)
                .containsExactlyInAnyOrder(read, write);

        // orphanRemoval deletes the obsolete DELETE link at transaction flush.
        verify(userRoleRepository, never()).save(any(UserRole.class));
    }

    @Test
    @DisplayName("updateComponents removes all links when components are omitted")
    void updateComponentsRemovesAllLinksWhenComponentsAreOmitted() {
        // GIVEN
        UserRole role = UserRoleFixture.aStandardUserRole();
        Component component = UserRoleFixture.aComponent(10, "CONNECTION");
        Permission read = UserRoleFixture.aPermission(100, "READ");
        role.addPermission(component, read);

        UserRoleResource resource = new UserRoleResource();
        resource.setComponents(null);

        when(userRoleRepository.findById(role.getId())).thenReturn(Optional.of(role));

        // WHEN
        userRoleService.updateComponents(role.getId(), resource);

        // THEN
        assertThat(role.getComponents()).isEmpty();
        assertThat(component.getPermissions()).isEmpty();
    }

    @Test
    @DisplayName("updateComponents propagates missing component lookup")
    void updateComponentsThrowsWhenComponentDoesNotExist() {
        // GIVEN
        UserRole role = UserRoleFixture.aStandardUserRole();
        UserRoleResource resource = new UserRoleResource();
        resource.setComponents(List.of(componentResource(99, Set.of("READ"))));

        when(userRoleRepository.findById(role.getId())).thenReturn(Optional.of(role));
        when(componentService.findById(99)).thenReturn(Optional.empty());

        // WHEN-THEN
        assertThatThrownBy(() -> userRoleService.updateComponents(role.getId(), resource))
                .isInstanceOf(java.util.NoSuchElementException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private UserRoleResource roleResource(String name, String description, String icon) {
        UserRoleResource resource = new UserRoleResource();
        resource.setName(name);
        resource.setDescription(description);
        resource.setIcon(icon);
        resource.setComponents(List.of());
        return resource;
    }

    private ComponentResource componentResource(int componentId, Set<String> permissions) {
        ComponentResource resource = new ComponentResource();
        resource.setComponentId(componentId);
        resource.setPermissions(permissions);
        return resource;
    }
}

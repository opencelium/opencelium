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
import com.becon.opencelium.backend.resource.user.UserRoleResource;
import com.becon.opencelium.backend.testutil.assertion.UserRoleAssertions;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link UserRoleServiceImpl}.
 *
 * No Spring context is loaded. The repository is mocked with Mockito.
 * Run with: ./gradlew test
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserRoleServiceImpl — unit")
class UserRoleServiceImplTest {

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private PermissionServiceImpl permissionService;

    @Mock
    private ComponentServiceImpl componentService;

    @InjectMocks
    private UserRoleServiceImpl userRoleService;

    // ── existsById ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("existsByIdReturnsTrueWhenRoleExistsInRepository")
    void existsByIdReturnsTrueWhenRoleExistsInRepository() {
        when(userRoleRepository.existsById(1)).thenReturn(true);

        boolean result = userRoleService.existsById(1);

        assertThat(result).isTrue();
        verify(userRoleRepository).existsById(1);
    }

    @Test
    @DisplayName("existsByIdReturnsFalseWhenRoleDoesNotExistInRepository")
    void existsByIdReturnsFalseWhenRoleDoesNotExistInRepository() {
        when(userRoleRepository.existsById(99)).thenReturn(false);

        assertThat(userRoleService.existsById(99)).isFalse();
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByIdReturnsRoleWhenIdExists")
    void findByIdReturnsRoleWhenIdExists() {
        UserRole expected = UserRoleFixture.aStandardUserRole();
        when(userRoleRepository.findById(1)).thenReturn(Optional.of(expected));

        Optional<UserRole> result = userRoleService.findById(1);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("ROLE_USER");
    }

    @Test
    @DisplayName("findByIdReturnsEmptyWhenIdDoesNotExist")
    void findByIdReturnsEmptyWhenIdDoesNotExist() {
        when(userRoleRepository.findById(99)).thenReturn(Optional.empty());

        assertThat(userRoleService.findById(99)).isEmpty();
    }

    // ── existsByRole ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("existsByRoleReturnsTrueWhenRoleNameExists")
    void existsByRoleReturnsTrueWhenRoleNameExists() {
        when(userRoleRepository.existsByName("ROLE_ADMIN")).thenReturn(true);

        assertThat(userRoleService.existsByRole("ROLE_ADMIN")).isTrue();
    }

    @Test
    @DisplayName("existsByRoleReturnsFalseWhenRoleNameDoesNotExist")
    void existsByRoleReturnsFalseWhenRoleNameDoesNotExist() {
        when(userRoleRepository.existsByName("ROLE_UNKNOWN")).thenReturn(false);

        assertThat(userRoleService.existsByRole("ROLE_UNKNOWN")).isFalse();
    }

    // ── getOne ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getOneReturnsRoleReferenceFromRepository")
    void getOneReturnsRoleWhenRepositoryHasEntry() {
        UserRole expected = UserRoleFixture.aStandardUserRole();
        when(userRoleRepository.getReferenceById(1)).thenReturn(expected);

        UserRole result = userRoleService.getOne(1);

        assertThat(result).isSameAs(expected);
        verify(userRoleRepository).getReferenceById(1);
    }

    // ── findByRole ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByRoleReturnsRoleWhenNameExists")
    void findByRoleReturnsRoleWhenNameExists() {
        UserRole expected = UserRoleFixture.anAdminRole();
        when(userRoleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(expected));

        Optional<UserRole> result = userRoleService.findByRole("ROLE_ADMIN");

        assertThat(result).isPresent().containsSame(expected);
    }

    @Test
    @DisplayName("findByRoleReturnsEmptyWhenNameDoesNotExist")
    void findByRoleReturnsEmptyWhenNameDoesNotExist() {
        when(userRoleRepository.findByName("ROLE_UNKNOWN")).thenReturn(Optional.empty());

        assertThat(userRoleService.findByRole("ROLE_UNKNOWN")).isEmpty();
    }

    // ── toEntity ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("toEntityCopiesScalarFieldsWhenResourceHasNoComponents")
    void toEntityCopiesScalarFieldsWhenResourceHasNoComponents() {
        UserRoleResource resource = UserRoleFixture.anAdminRoleResource();

        UserRole entity = userRoleService.toEntity(resource);

        UserRoleAssertions.assertThat(entity)
                .isAdmin()
                .hasDescription("Administrator role")
                .hasIcon("admin-icon.png")
                .hasNoComponents();
        assertThat(entity.getId()).isEqualTo(2);
    }

    @Test
    @DisplayName("toEntityFlattensComponentsAndPermissionsIntoRoleHasPermission")
    void toEntityFlattensComponentsAndPermissionsWhenResourceHasComponents() {
        UserRoleResource resource = UserRoleFixture.aResourceWithTwoComponentsTwoPermissionsEach();

        Component moduleA = UserRoleFixture.aComponent(10, "Module-A");
        Component moduleB = UserRoleFixture.aComponent(20, "Module-B");
        Permission read  = UserRoleFixture.aPermission(100, "READ");
        Permission write = UserRoleFixture.aPermission(101, "WRITE");

        when(componentService.findById(10)).thenReturn(Optional.of(moduleA));
        when(componentService.findById(20)).thenReturn(Optional.of(moduleB));
        when(permissionService.findByName("READ")).thenReturn(Optional.of(read));
        when(permissionService.findByName("WRITE")).thenReturn(Optional.of(write));

        UserRole entity = userRoleService.toEntity(resource);

        // 2 components × 2 permissions = 4 RoleHasPermission entries.
        // RoleHasPermission has no equals/hashCode override, so identity-based Set
        // preserves every distinct (role, component, permission) tuple.
        assertThat(entity.getComponents()).hasSize(4);
        assertThat(entity.getComponents())
                .extracting(RoleHasPermission::getComponent)
                .containsOnly(moduleA, moduleB);
        assertThat(entity.getComponents())
                .extracting(RoleHasPermission::getPermission)
                .containsOnly(read, write);
        assertThat(entity.getComponents())
                .extracting(RoleHasPermission::getUserRole)
                .containsOnly(entity);
    }

    @Test
    @DisplayName("toEntityReturnsEmptyComponentSetWhenResourceHasNoComponents")
    void toEntityReturnsEmptyComponentSetWhenResourceHasNoComponents() {
        UserRoleResource resource = UserRoleFixture.aStandardUserRoleResource();

        UserRole entity = userRoleService.toEntity(resource);

        assertThat(entity.getComponents()).isEmpty();
    }

    @Test
    @DisplayName("toEntityPropagatesNoSuchElementWhenComponentLookupMissing")
    void toEntityPropagatesNoSuchElementWhenComponentLookupMissing() {
        UserRoleResource resource = UserRoleFixture.aResourceWithSingleComponent(99, Set.of("READ"));
        when(componentService.findById(99)).thenReturn(Optional.empty());

        // Pins current behaviour: impl calls Optional.get() on the lookup result,
        // so a missing component surfaces as NoSuchElementException.
        assertThatThrownBy(() -> userRoleService.toEntity(resource))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ── toResource ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("toResourceCopiesScalarFieldsWhenRoleHasNoComponents")
    void toResourceCopiesScalarFieldsWhenRoleHasNoComponents() {
        UserRole role = UserRoleFixture.aStandardUserRole();

        UserRoleResource resource = userRoleService.toResource(role);

        assertThat(resource.getGroupId()).isEqualTo(role.getId());
        assertThat(resource.getName()).isEqualTo(role.getName());
        assertThat(resource.getDescription()).isEqualTo(role.getDescription());
        assertThat(resource.getIcon()).isNull();
        assertThat(resource.getComponents()).isEmpty();
    }

    @Test
    @DisplayName("toResourceDedupesComponentsAcrossRoleHasPermission")
    void toResourceDedupesComponentsWhenSameComponentRepeats() {
        UserRole role = UserRoleFixture.aRoleWithSharedComponent();

        UserRoleResource resource = userRoleService.toResource(role);

        // Two RoleHasPermission entries point at the same Component.
        // UserRoleResource constructor dedupes via Set<Component> before mapping,
        // so the produced resource should expose exactly one ComponentResource.
        assertThat(resource.getComponents()).hasSize(1);
        assertThat(resource.getComponents().get(0).getPermissions())
                .containsExactlyInAnyOrder("READ", "WRITE");
    }
}

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
import com.becon.opencelium.backend.database.mysql.repository.PermissionRepository;
import com.becon.opencelium.backend.database.mysql.service.PermissionServiceImpl;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link PermissionServiceImpl}.
 *
 * Covers the repository delegation contract of {@code findByName} and the
 * in-memory mapping behaviour of {@code toResource} (including the
 * null-safety gaps that the production code currently has).
 */
@ExtendWith(MockitoExtension.class)
class PermissionServiceImplTest {

    @Mock
    private PermissionRepository permissionRepository;

    @InjectMocks
    private PermissionServiceImpl service;

    // ── findByName ────────────────────────────────────────────────────────────

    @Test
    void findByNameReturnsPermissionWhenRepositoryFindsIt() {
        Permission permission = UserRoleFixture.aPermission(100, "READ");
        when(permissionRepository.findByName("READ")).thenReturn(Optional.of(permission));

        Optional<Permission> result = service.findByName("READ");

        assertThat(result).containsSame(permission);
    }

    @Test
    void findByNameReturnsEmptyWhenRepositoryReturnsEmpty() {
        when(permissionRepository.findByName("MISSING")).thenReturn(Optional.empty());

        Optional<Permission> result = service.findByName("MISSING");

        assertThat(result).isEmpty();
    }

    // ── toResource ────────────────────────────────────────────────────────────

    @Test
    void toResourceReturnsPermissionNamesWhenInputHasRoleHasPermissions() {
        UserRole role = UserRoleFixture.aStandardUserRole();
        Component component = UserRoleFixture.aComponent(10, "Module-A");
        RoleHasPermission read = new RoleHasPermission(role, component, UserRoleFixture.aPermission(100, "READ"));
        RoleHasPermission write = new RoleHasPermission(role, component, UserRoleFixture.aPermission(101, "WRITE"));

        Set<String> result = service.toResource(Set.of(read, write));

        assertThat(result).containsExactlyInAnyOrder("READ", "WRITE");
    }

    @Test
    void toResourceReturnsSingleEntryWhenMultipleRowsReferenceSamePermissionName() {
        UserRole role = UserRoleFixture.aStandardUserRole();
        Component componentA = UserRoleFixture.aComponent(10, "Module-A");
        Component componentB = UserRoleFixture.aComponent(20, "Module-B");
        // Two RHP rows, two distinct Permission objects, same name — the
        // produced Set deduplicates by string value.
        RoleHasPermission a = new RoleHasPermission(role, componentA, UserRoleFixture.aPermission(100, "READ"));
        RoleHasPermission b = new RoleHasPermission(role, componentB, UserRoleFixture.aPermission(200, "READ"));

        Set<String> result = service.toResource(Set.of(a, b));

        assertThat(result).containsExactly("READ");
    }

    @Test
    void toResourceReturnsEmptySetWhenInputIsEmpty() {
        Set<String> result = service.toResource(Collections.emptySet());

        assertThat(result).isEmpty();
    }

    @Test
    void toResourceThrowsNullPointerExceptionWhenInputIsNull() {
        assertThatThrownBy(() -> service.toResource(null))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void toResourceThrowsNullPointerExceptionWhenAnyRoleHasPermissionPermissionIsNull() {
        // Hand-craft an RHP whose permission reference is null — simulates a
        // dangling row (no FK cascade) or a row constructed without the
        // 3-arg constructor that wires associations.
        RoleHasPermission orphan = new RoleHasPermission();
        orphan.setPermission(null);
        Set<RoleHasPermission> input = new HashSet<>();
        input.add(orphan);

        assertThatThrownBy(() -> service.toResource(input))
                .isInstanceOf(NullPointerException.class);
    }
}

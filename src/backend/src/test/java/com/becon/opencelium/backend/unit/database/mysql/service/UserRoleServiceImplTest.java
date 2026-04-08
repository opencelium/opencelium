/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.repository.UserRoleRepository;
import com.becon.opencelium.backend.database.mysql.service.ComponentServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.PermissionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.exception.RoleNotFoundException;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
//import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

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
}

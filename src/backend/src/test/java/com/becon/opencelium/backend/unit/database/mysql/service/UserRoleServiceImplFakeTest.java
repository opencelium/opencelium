/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.exception.RoleNotFoundException;
import com.becon.opencelium.backend.testutil.assertion.UserRoleAssertions;
import com.becon.opencelium.backend.testutil.fake.InMemoryUserRoleRepository;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

/**
 * Unit tests for {@link UserRoleServiceImpl} using the in-memory fake
 * repository and custom AssertJ assertions.
 *
 * Uses InMemoryUserRoleRepository instead of Mockito mocks because these
 * tests verify sequences of operations — save then find, save then delete —
 * where a fake behaves more naturally than a mock that requires explicit
 * when(…).thenReturn(…) for every call.
 *
 * Run with: ./gradlew test
 */
@DisplayName("UserRoleServiceImplFakeTest — unit (with fake repository)")
class UserRoleServiceImplFakeTest {

    private InMemoryUserRoleRepository repository;
    private UserRoleServiceImpl userRoleService;

    @BeforeEach
    void setUp() {
        // Fresh repository before every test — no shared state between tests
        repository = new InMemoryUserRoleRepository();
        userRoleService = new UserRoleServiceImpl(
                mock(com.becon.opencelium.backend.database.mysql.service.PermissionServiceImpl.class),
                mock(com.becon.opencelium.backend.database.mysql.service.ComponentServiceImpl.class),
                repository
        );
    }

    // ── save + existsById ─────────────────────────────────────────────────────

    @Test
    @DisplayName("existsByIdReturnsTrueAfterSave")
    void existsByIdReturnsTrueWhenRoleWasSaved() {
        UserRole role = UserRoleFixture.aStandardUserRole();

        userRoleService.save(role);

        assertThat(userRoleService.existsById(role.getId())).isTrue();
    }

    @Test
    @DisplayName("existsByIdReturnsFalseWhenRoleNeverSaved")
    void existsByIdReturnsFalseWhenRoleNeverSaved() {
        assertThat(userRoleService.existsById(99)).isFalse();
    }

    // ── save + findById ───────────────────────────────────────────────────────

    @Test
    @DisplayName("findByIdReturnsCorrectRoleAfterSave")
    void findByIdReturnsRoleWhenRoleWasSaved() {
        UserRole role = UserRoleFixture.anAdminRole();
        userRoleService.save(role);

        UserRole result = userRoleService.findById(role.getId()).orElseThrow();

        UserRoleAssertions.assertThat(result)
                .isAdmin()
                .hasDescription("Administrator role")
                .hasIcon("admin-icon.png");
    }

    // ── saveAll + findAll ─────────────────────────────────────────────────────

    @Test
    @DisplayName("findAllReturnsAllRolesSavedInBulk")
    void findAllReturnsAllRolesWhenMultipleSaved() {
        // saveAll — bulk load for tests that need multiple roles as starting state
        repository.saveAll(List.of(
                UserRoleFixture.aStandardUserRole(),
                UserRoleFixture.anAdminRole()
        ));

        assertThat(userRoleService.findAll()).hasSize(2);
    }

    // ── save + deleteById + existsById ────────────────────────────────────────

    @Test
    @DisplayName("existsByIdReturnsFalseAfterDeleteById")
    void existsByIdReturnsFalseWhenRoleWasDeleted() {
        UserRole role = UserRoleFixture.aStandardUserRole();
        userRoleService.save(role);

        userRoleService.deleteById(role.getId());

        assertThat(userRoleService.existsById(role.getId())).isFalse();
    }

    @Test
    void savePersistsUserRoleWhenNotNull() {
        UserRole role = UserRoleFixture.aStandardUserRole();

        userRoleService.save(role);

        Optional<UserRole>  saved = userRoleService.findById(role.getId());
        assertThat(saved)
                .as("UserRole with id %d and name %s should exist after save()", role.getId(), role.getName())
                .isPresent();
    }

    // ── existsByRole ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("existsByRoleReturnsTrueAfterSave")
    void existsByRoleReturnsTrueWhenRoleWasSaved() {
        userRoleService.save(UserRoleFixture.anAdminRole());

        assertThat(userRoleService.existsByRole("ROLE_ADMIN")).isTrue();
    }

    @Test
    @DisplayName("existsByRoleReturnsFalseWhenRoleNeverSaved")
    void existsByRoleReturnsFalseWhenRoleNeverSaved() {
        assertThat(userRoleService.existsByRole("ROLE_UNKNOWN")).isFalse();
    }
}

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
import com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.exception.RoleNotFoundException;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
//import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
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

    @InjectMocks
    private UserRoleServiceImpl userRoleService;

    // ── existsById ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("existsById returns true when role exists in repository")
    void existsByIdReturnsTrueWhenRoleExists() {
        when(userRoleRepository.existsById(1)).thenReturn(true);

        boolean result = userRoleService.existsById(1);

        assertThat(result).isTrue();
        verify(userRoleRepository).existsById(1);
    }

    @Test
    @DisplayName("existsById returns false when role does not exist in repository")
    void existsByIdReturnsFalseWhenRoleDoesNotExist() {
        when(userRoleRepository.existsById(99)).thenReturn(false);

        boolean result = userRoleService.existsById(99);

        assertThat(result).isFalse();
    }

    // ── getOne ────────────────────────────────────────────────────────────────
//
//    @Test
//    @DisplayName("getOne returns role when id exists")
//    void getOneReturnsRoleWhenIdExists() {
//        UserRole expected = UserRoleFixture.anAdminRole();
//        when(userRoleRepository.findById(2)).thenReturn(Optional.of(expected));
//
//        UserRole result = userRoleService.getOne(2);
//
//        assertThat(result.getName()).isEqualTo("ROLE_ADMIN");
//        assertThat(result.getDescription()).isEqualTo("Administrator role");
//    }

    @Test
    @DisplayName("getOne throws RoleNotFoundException when id does not exist")
    void getOneThrowsRoleNotFoundExceptionWhenIdDoesNotExist() {
        when(userRoleRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userRoleService.getOne(99))
                .isInstanceOf(RoleNotFoundException.class);
    }
}

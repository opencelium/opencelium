/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.database.mysql.repository.RoleHasPermissionRepository;
import com.becon.opencelium.backend.database.mysql.service.RoleHasPermissionServiceImp;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link RoleHasPermissionServiceImp}.
 *
 * Each method is a thin delegate over {@link RoleHasPermissionRepository}.
 * The {@code existsById} method is intentionally exercised through the impl
 * type — it is not on the {@code RoleHasPermissionService} interface, so
 * callers using the interface cannot reach it. This test pins that contract.
 */
@ExtendWith(MockitoExtension.class)
class RoleHasPermissionServiceImpTest {

    @Mock
    private RoleHasPermissionRepository repository;

    @InjectMocks
    private RoleHasPermissionServiceImp service;

    @Test
    void deleteDelegatesToRepositoryWithGivenId() {
        RoleHasPermission.RoleHasPermissionId id = new RoleHasPermission.RoleHasPermissionId(1, 2, 3);

        service.delete(id);

        verify(repository).deleteById(id);
    }

    @Test
    void deleteByUserRoleIdDelegatesToRepository() {
        service.deleteByUserRoleId(7);

        verify(repository).deleteByUserRoleId(7);
    }

    @Test
    void existsByIdReturnsTrueWhenRepositoryReportsExists() {
        RoleHasPermission.RoleHasPermissionId id = new RoleHasPermission.RoleHasPermissionId(1, 2, 3);
        when(repository.existsById(id)).thenReturn(true);

        assertThat(service.existsById(id)).isTrue();
    }

    @Test
    void existsByIdReturnsFalseWhenRepositoryReportsAbsent() {
        RoleHasPermission.RoleHasPermissionId id = new RoleHasPermission.RoleHasPermissionId(1, 2, 3);
        when(repository.existsById(id)).thenReturn(false);

        assertThat(service.existsById(id)).isFalse();
    }
}

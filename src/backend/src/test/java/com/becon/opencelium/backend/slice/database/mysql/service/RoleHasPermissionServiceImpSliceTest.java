/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Component;
import com.becon.opencelium.backend.database.mysql.entity.Permission;
import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.repository.RoleHasPermissionRepository;
import com.becon.opencelium.backend.database.mysql.service.RoleHasPermissionServiceImp;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JPA slice test for {@link RoleHasPermissionServiceImp#deleteByUserRoleId(int)}.
 *
 * A unit test can only verify the repository method was called. The whole
 * point of the production method is that the derived-query name
 * {@code deleteByUserRoleId} resolves to a SQL DELETE scoped by
 * {@code role_id} — a typo or scope mistake would, for example, wipe every
 * row in {@code role_has_permission}. Only a real SQL engine catches that.
 *
 * Run with: ./gradlew test --tests "*.RoleHasPermissionServiceImpSliceTest"
 */
@SliceTest
@Import(RoleHasPermissionServiceImp.class)
@DisplayName("RoleHasPermissionServiceImp — JPA slice")
class RoleHasPermissionServiceImpSliceTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private RoleHasPermissionServiceImp service;

    @Autowired
    private RoleHasPermissionRepository repository;

    @Test
    void deleteByUserRoleIdRemovesEveryRowWithMatchingRoleIdAndLeavesOthersIntact() {
        UserRole roleA = persistedRole("ROLE_A");
        UserRole roleB = persistedRole("ROLE_B");
        Component component = persistedComponent("Module-A");
        Permission read = persistedPermission("READ");
        Permission write = persistedPermission("WRITE");

        em.persist(new RoleHasPermission(roleA, component, read));
        em.persist(new RoleHasPermission(roleA, component, write));
        em.persist(new RoleHasPermission(roleB, component, read));
        em.flush();
        em.clear();

        service.deleteByUserRoleId(roleA.getId());
        em.flush();
        em.clear();

        assertThat(repository.findAll())
                .extracting(rhp -> rhp.getUserRole().getId(), rhp -> rhp.getPermission().getId())
                .containsExactly(org.assertj.core.groups.Tuple.tuple(roleB.getId(), read.getId()));
    }

    @Test
    void deleteByUserRoleIdLeavesUnrelatedRowsAloneWhenNoRowsMatchRoleId() {
        UserRole role = persistedRole("ROLE_A");
        Component component = persistedComponent("Module-A");
        Permission read = persistedPermission("READ");

        em.persist(new RoleHasPermission(role, component, read));
        em.flush();
        em.clear();

        service.deleteByUserRoleId(role.getId() + 999); // unknown role id

        assertThat(repository.findAll()).hasSize(1);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private UserRole persistedRole(String name) {
        UserRole role = new UserRole();
        role.setName(name);
        role.setDescription(name + " description");
        return em.persistAndFlush(role);
    }

    private Component persistedComponent(String name) {
        Component component = new Component();
        component.setName(name);
        component.setDescription(name + " description");
        return em.persistAndFlush(component);
    }

    private Permission persistedPermission(String name) {
        Permission permission = new Permission();
        permission.setName(name);
        permission.setDescription(name + " description");
        return em.persistAndFlush(permission);
    }
}

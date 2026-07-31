/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.Component;
import com.becon.opencelium.backend.database.mysql.entity.Permission;
import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.resource.user.ComponentResource;
import com.becon.opencelium.backend.resource.user.UserRoleResource;

import java.util.List;
import java.util.Set;

/**
 * Object mother for {@link UserRole} and {@link UserRoleResource} test data.
 *
 * Use the named factory methods in test classes — never construct
 * UserRole or UserRoleResource inline. Add new named scenarios here
 * instead of duplicating setup across test classes.
 */
public final class UserRoleFixture {

    private UserRoleFixture() {}

    // ── Entity factories ──────────────────────────────────────────────────────

    /**
     * Standard unprivileged user role.
     * Use as the default for most tests.
     */
    public static UserRole aStandardUserRole() {
        UserRole role = new UserRole();
        role.setId(1);
        role.setName("ROLE_USER");
        role.setDescription("Standard user role");
        role.setIcon(null);
        return role;
    }

    /**
     * Administrator role.
     * Use when testing privileged-access or conflict scenarios.
     */
    public static UserRole anAdminRole() {
        UserRole role = new UserRole();
        role.setId(2);
        role.setName("ROLE_ADMIN");
        role.setDescription("Administrator role");
        role.setIcon("admin-icon.png");
        return role;
    }

    /**
     * Unsaved role (id = 0).
     * Use when testing save / insert behaviour where the id
     * is expected to be assigned by the database.
     */
    public static UserRole aNewRole(String name, String description) {
        UserRole role = new UserRole();
        role.setId(0);
        role.setName(name);
        role.setDescription(description);
        role.setIcon(null);
        return role;
    }

    // ── Resource factories ────────────────────────────────────────────────────

    /**
     * Resource representation matching {@link #aStandardUserRole()}.
     */
    public static UserRoleResource aStandardUserRoleResource() {
        UserRoleResource resource = new UserRoleResource();
        resource.setGroupId(1);
        resource.setName("ROLE_USER");
        resource.setDescription("Standard user role");
        resource.setIcon(null);
        return resource;
    }

    /**
     * Resource representation matching {@link #anAdminRole()}.
     */
    public static UserRoleResource anAdminRoleResource() {
        UserRoleResource resource = new UserRoleResource();
        resource.setGroupId(2);
        resource.setName("ROLE_ADMIN");
        resource.setDescription("Administrator role");
        resource.setIcon("admin-icon.png");
        return resource;
    }

    /**
     * Resource carrying a single {@link ComponentResource} with the supplied
     * permission names. Use for negative-path mapping tests (e.g. lookup miss).
     */
    public static UserRoleResource aResourceWithSingleComponent(int componentId, Set<String> permissions) {
        UserRoleResource resource = aStandardUserRoleResource();
        ComponentResource componentResource = new ComponentResource();
        componentResource.setComponentId(componentId);
        componentResource.setName("component-" + componentId);
        componentResource.setPermissions(permissions);
        resource.setComponents(List.of(componentResource));
        return resource;
    }

    /**
     * Resource with two components, each declaring READ + WRITE permissions.
     * Drives the cartesian flatten path in {@code toEntity}: 2 × 2 = 4 RoleHasPermission.
     */
    public static UserRoleResource aResourceWithTwoComponentsTwoPermissionsEach() {
        UserRoleResource resource = aStandardUserRoleResource();

        ComponentResource a = new ComponentResource();
        a.setComponentId(10);
        a.setName("Module-A");
        a.setPermissions(Set.of("READ", "WRITE"));

        ComponentResource b = new ComponentResource();
        b.setComponentId(20);
        b.setName("Module-B");
        b.setPermissions(Set.of("READ", "WRITE"));

        resource.setComponents(List.of(a, b));
        return resource;
    }

    // ── Component / Permission factories ──────────────────────────────────────

    public static Component aComponent(int id, String name) {
        Component component = new Component();
        component.setId(id);
        component.setName(name);
        return component;
    }

    public static Permission aPermission(int id, String name) {
        Permission permission = new Permission();
        permission.setId(id);
        permission.setName(name);
        return permission;
    }

    /**
     * Standard user role wired to a single {@link Component} via two
     * {@link RoleHasPermission} entries (READ + WRITE).
     *
     * Used to exercise the dedupe path in {@code UserRoleResource} — both
     * RoleHasPermission entries point at the same Component, so the produced
     * resource should expose exactly one {@link ComponentResource}.
     *
     * Note: the {@code RoleHasPermission} constructor side-effects
     * {@code role.getComponents()} and {@code component.getPermissions()} —
     * no extra wiring needed here.
     */
    public static UserRole aRoleWithSharedComponent() {
        UserRole role = aStandardUserRole();
        Component module = aComponent(10, "Module-A");
        new RoleHasPermission(role, module, aPermission(100, "READ"));
        new RoleHasPermission(role, module, aPermission(101, "WRITE"));
        return role;
    }
}

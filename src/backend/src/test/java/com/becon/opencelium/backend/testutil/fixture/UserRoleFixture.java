/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.resource.user.UserRoleResource;

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
}

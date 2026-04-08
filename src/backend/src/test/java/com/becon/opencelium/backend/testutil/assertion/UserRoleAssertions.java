/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.assertion;

import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import org.assertj.core.api.AbstractAssert;

/**
 * Custom AssertJ assertions for {@link UserRole}.
 *
 * Wraps repeated field-level checks into readable, chainable one-liners so
 * test classes express intent rather than field comparisons.
 *
 * Usage:
 *   UserRoleAssertions.assertThat(role)
 *                     .isAdmin()
 *                     .hasDescription("Administrator role")
 *                     .hasNoIcon();
 *
 * Add a new method here when the same field check appears in two or more
 * test classes. Do not add methods speculatively — let duplication drive it.
 */
public class UserRoleAssertions  extends AbstractAssert<UserRoleAssertions, UserRole> {

    private UserRoleAssertions(UserRole actual) {
        super(actual, UserRoleAssertions.class);
    }

    /**
     * Entry point — mirrors AssertJ's assertThat() style.
     *
     * UserRoleAssertions.assertThat(role).isAdmin().hasNoIcon();
     */
    public static UserRoleAssertions assertThat(UserRole actual) {
        return new UserRoleAssertions(actual);
    }

    // ── Name checks ───────────────────────────────────────────────────────────

    /**
     * Verifies the role has the given name.
     */
    public UserRoleAssertions hasName(String expected) {
        isNotNull();
        if (!expected.equals(actual.getName())) {
            failWithMessage(
                "Expected role name to be <%s> but was <%s>",
                expected, actual.getName()
            );
        }
        return this;
    }

    /**
     * Verifies the role name is "ROLE_ADMIN".
     */
    public UserRoleAssertions isAdmin() {
        return hasName("ROLE_ADMIN");
    }

    /**
     * Verifies the role name is "ROLE_USER".
     */
    public UserRoleAssertions isStandardUser() {
        return hasName("ROLE_USER");
    }

    // ── Description checks ────────────────────────────────────────────────────

    /**
     * Verifies the role has the given description.
     */
    public UserRoleAssertions hasDescription(String expected) {
        isNotNull();
        if (!expected.equals(actual.getDescription())) {
            failWithMessage(
                "Expected description to be <%s> but was <%s>",
                expected, actual.getDescription()
            );
        }
        return this;
    }

    /**
     * Verifies the role has no description (null or blank).
     */
    public UserRoleAssertions hasNoDescription() {
        isNotNull();
        if (actual.getDescription() != null && !actual.getDescription().isBlank()) {
            failWithMessage(
                "Expected no description but was <%s>",
                actual.getDescription()
            );
        }
        return this;
    }

    // ── Icon checks ───────────────────────────────────────────────────────────

    /**
     * Verifies the role has a non-null, non-blank icon.
     */
    public UserRoleAssertions hasIcon() {
        isNotNull();
        if (actual.getIcon() == null || actual.getIcon().isBlank()) {
            failWithMessage("Expected role to have an icon but icon was null or blank");
        }
        return this;
    }

    /**
     * Verifies the role has no icon (null).
     */
    public UserRoleAssertions hasNoIcon() {
        isNotNull();
        if (actual.getIcon() != null) {
            failWithMessage(
                "Expected no icon but was <%s>",
                actual.getIcon()
            );
        }
        return this;
    }

    /**
     * Verifies the role has the given icon value.
     */
    public UserRoleAssertions hasIcon(String expected) {
        isNotNull();
        if (!expected.equals(actual.getIcon())) {
            failWithMessage(
                "Expected icon to be <%s> but was <%s>",
                expected, actual.getIcon()
            );
        }
        return this;
    }

    // ── Component checks ──────────────────────────────────────────────────────

    /**
     * Verifies the role has no components assigned.
     */
    public UserRoleAssertions hasNoComponents() {
        isNotNull();
        if (!actual.getComponents().isEmpty()) {
            failWithMessage(
                "Expected no components but found <%d>",
                actual.getComponents().size()
            );
        }
        return this;
    }

    /**
     * Verifies the role has exactly the given number of components.
     */
    public UserRoleAssertions hasComponentCount(int expected) {
        isNotNull();
        int actual = this.actual.getComponents().size();
        if (actual != expected) {
            failWithMessage(
                "Expected <%d> components but found <%d>",
                expected, actual
            );
        }
        return this;
    }
}

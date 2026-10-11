/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.security.GroupRoleResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Run with: ./gradlew test --tests "*.GroupRoleResolverTest"
 */
@DisplayName("GroupRoleResolver - the configured mapping decides the role")
class GroupRoleResolverTest {

    private static final Map<String, String> ROLES = Map.of(
            "oc-users", "User",
            "oc-admins", "Admin");

    @Test
    void firstMappedGroupWinsNoMatterInWhichOrderTheGroupsAreReported() {
        // Entra ID does not return the groups in a stable order, so the result must not depend on it.
        assertThat(resolve(List.of("oc-admins", "oc-users"), groups("oc-users", "oc-admins")))
                .isEqualTo("Admin");
        assertThat(resolve(List.of("oc-admins", "oc-users"), groups("oc-admins", "oc-users")))
                .isEqualTo("Admin");
    }

    @Test
    void theConfiguredOrderOfTheMappingDecides() {
        assertThat(resolve(List.of("oc-users", "oc-admins"), groups("oc-admins", "oc-users")))
                .isEqualTo("User");
    }

    @Test
    void defaultRoleIsUsedWhenNoMappedGroupMatches() {
        assertThat(resolve(List.of("oc-admins"), groups("oc-contractors"))).isEqualTo("User");
    }

    @Test
    void defaultRoleIsUsedWhenTheMappingIsEmpty() {
        assertThat(resolve(List.of(), groups("oc-admins"))).isEqualTo("User");
    }

    @Test
    void defaultRoleIsUsedWhenTheUserIsInNoGroup() {
        assertThat(resolve(List.of("oc-admins"), Set.of())).isEqualTo("User");
    }

    @Test
    void groupsAreEvaluatedInTheConfiguredOrderAndReportedInTheLog() {
        List<String> log = new ArrayList<>();

        String role = GroupRoleResolver.resolveRole("OIDC", List.of("oc-admins", "oc-users"), Set.of("oc-users"),
                ROLES::get, "User", log::add);

        assertThat(role).isEqualTo("User");
        assertThat(log).containsExactly(
                "No match found for OIDC group = 'oc-admins' in OC mappings [oc-admins; oc-users]",
                "Match found for OIDC group = 'oc-users'");
    }

    private String resolve(List<String> mappedGroups, Set<String> userGroups) {
        return GroupRoleResolver.resolveRole("OIDC", mappedGroups, userGroups, ROLES::get, "User", message -> {
        });
    }

    private Set<String> groups(String... groups) {
        return new LinkedHashSet<>(List.of(groups));
    }
}

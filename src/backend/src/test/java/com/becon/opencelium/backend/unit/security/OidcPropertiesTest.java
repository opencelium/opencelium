/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.configuration.OidcProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.NoSuchElementException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Run with: ./gradlew test --tests "*.OidcPropertiesTest"
 */
@DisplayName("OidcProperties — group to role mapping")
class OidcPropertiesTest {

    @Test
    void getRoleByGroupReturnsMappedRoleWhenGroupIsMapped() {
        OidcProperties properties = propertiesWith(mapping("oc-admins", "Admin"));

        assertThat(properties.getRoleByGroup("oc-admins")).isEqualTo("Admin");
    }

    @Test
    void getRoleByGroupThrowsWhenGroupIsNotMapped() {
        OidcProperties properties = propertiesWith(mapping("oc-admins", "Admin"));

        assertThatThrownBy(() -> properties.getRoleByGroup("oc-unknown"))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void getGroupsReturnsEveryMappedGroupWhenSeveralAreConfigured() {
        OidcProperties properties = propertiesWith(mapping("oc-admins", "Admin"), mapping("oc-users", "User"));

        assertThat(properties.getGroups()).containsExactly("oc-admins", "oc-users");
    }

    @Test
    void getGroupsReturnsEmptyListWhenNoMappingIsConfigured() {
        OidcProperties properties = new OidcProperties();

        assertThat(properties.getGroups()).isEmpty();
    }

    @Test
    void isJitProvisioningReturnsTrueByDefault() {
        assertThat(new OidcProperties().isJitProvisioning()).isTrue();
    }

    @Test
    void isEnabledReturnsFalseByDefault() {
        assertThat(new OidcProperties().isEnabled()).isFalse();
    }

    private OidcProperties propertiesWith(OidcProperties.Group2Role... mappings) {
        OidcProperties properties = new OidcProperties();
        properties.setGroupRoleMapping(List.of(mappings));

        return properties;
    }

    private OidcProperties.Group2Role mapping(String group, String role) {
        OidcProperties.Group2Role mapping = new OidcProperties.Group2Role();
        mapping.setGroup(group);
        mapping.setOcRole(role);

        return mapping;
    }
}

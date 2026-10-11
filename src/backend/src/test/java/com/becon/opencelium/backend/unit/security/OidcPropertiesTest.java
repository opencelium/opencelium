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
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

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

    @Test
    void validateStaysSilentWhileTheFeatureIsDisabled() {
        assertThatCode(new OidcProperties()::validate).doesNotThrowAnyException();
    }

    @Test
    void validateAcceptsDiscoveryConfiguration() {
        OidcProperties properties = clientProperties();
        properties.setIssuerUri("https://idp.example.com");

        assertThatCode(properties::validate).doesNotThrowAnyException();
    }

    @Test
    void validateAcceptsManuallyConfiguredEndpoints() {
        OidcProperties properties = clientProperties();
        properties.setAuthorizationUri("https://idp.example.com/authorize");
        properties.setTokenUri("https://idp.example.com/token");
        properties.setJwkSetUri("https://idp.example.com/jwks");

        assertThatCode(properties::validate).doesNotThrowAnyException();
    }

    @Test
    void validateNamesEverySettingAnEnabledLoginCannotWorkWithout() {
        OidcProperties properties = new OidcProperties();
        properties.setEnabled(true);

        IllegalStateException failure = catchThrowableOfType(properties::validate, IllegalStateException.class);

        assertThat(failure)
                .isNotNull()
                .hasMessageContaining("client-id")
                .hasMessageContaining("client-secret")
                .hasMessageContaining("redirect-uri")
                .hasMessageContaining("frontend-redirect-uri")
                .hasMessageContaining("authorization-uri")
                .hasMessageContaining("token-uri")
                .hasMessageContaining("jwk-set-uri");
    }

    @Test
    void validateAsksForTheEndpointsOnlyWhenDiscoveryIsNotConfigured() {
        IllegalStateException failure = catchThrowableOfType(clientProperties()::validate, IllegalStateException.class);

        assertThat(failure).isNotNull();
        assertThat(failure.getMessage())
                .doesNotContain("client-id", "client-secret", "redirect-uri", "frontend-redirect-uri")
                .contains("authorization-uri", "token-uri", "jwk-set-uri");
    }

    /** Everything an enabled login needs apart from the provider endpoints, which discovery or the
     * three explicit endpoints have to provide. */
    private OidcProperties clientProperties() {
        OidcProperties properties = new OidcProperties();
        properties.setEnabled(true);
        properties.setClientId("opencelium");
        properties.setClientSecret("secret");
        properties.setRedirectUri("http://localhost:9090/oidc/callback");
        properties.setFrontendRedirectUri("http://localhost:5173/oidc/callback");

        return properties;
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

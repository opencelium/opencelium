/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.database.mysql.service.OidcLoginService;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.security.oidc.OidcAuthenticationProvider;
import com.becon.opencelium.backend.security.oidc.OidcAuthenticationToken;
import com.becon.opencelium.backend.security.oidc.OidcIdentity;
import com.becon.opencelium.backend.security.oidc.OidcLoginException;
import com.becon.opencelium.backend.security.oidc.OidcUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Run with: ./gradlew test --tests "*.OidcAuthenticationProviderTest"
 */
@DisplayName("OidcAuthenticationProvider — ticket to authentication")
class OidcAuthenticationProviderTest {

    private final OidcLoginService oidcLoginService = mock(OidcLoginService.class);
    private final UserService userService = mock(UserService.class);
    private final OidcProperties properties = new OidcProperties();

    private OidcAuthenticationProvider provider;

    @BeforeEach
    void setUp() {
        provider = new OidcAuthenticationProvider(oidcLoginService, userService, properties);
    }

    @Test
    void supportsReturnsTrueWhenTokenIsAnOidcAuthenticationToken() {
        assertThat(provider.supports(OidcAuthenticationToken.class)).isTrue();
    }

    @Test
    void supportsReturnsFalseWhenTokenIsAUsernamePasswordToken() {
        assertThat(provider.supports(UsernamePasswordAuthenticationToken.class)).isFalse();
    }

    @Test
    void authenticateReturnsIdentityWithGroupAuthoritiesWhenTicketIsValid() {
        when(oidcLoginService.consumeTicket("ticket-value")).thenReturn(identity());

        Authentication authentication = provider.authenticate(new OidcAuthenticationToken("ticket-value"));

        assertThat(authentication.getPrincipal()).isInstanceOf(OidcUserDetails.class);
        assertThat(((OidcUserDetails) authentication.getPrincipal()).getEmail()).isEqualTo("alice@example.com");
        assertThat(authentication.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("oc-admins");
    }

    @Test
    void authenticateThrowsWhenTicketWasAlreadyConsumed() {
        when(oidcLoginService.consumeTicket("used-ticket"))
                .thenThrow(new OidcLoginException("invalid_code", "The one-time code has expired or was already used."));

        assertThatThrownBy(() -> provider.authenticate(new OidcAuthenticationToken("used-ticket")))
                .isInstanceOf(OidcLoginException.class);
    }

    @Test
    void authenticateThrowsWhenUserIsUnknownAndJitProvisioningIsDisabled() {
        properties.setJitProvisioning(false);
        when(oidcLoginService.consumeTicket("ticket-value")).thenReturn(identity());
        when(userService.existsByEmail("alice@example.com")).thenReturn(false);

        assertThatThrownBy(() -> provider.authenticate(new OidcAuthenticationToken("ticket-value")))
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "user_not_provisioned");
    }

    @Test
    void authenticateReturnsIdentityWhenUserIsUnknownButJitProvisioningIsEnabled() {
        when(oidcLoginService.consumeTicket("ticket-value")).thenReturn(identity());
        when(userService.existsByEmail("alice@example.com")).thenReturn(false);

        Authentication authentication = provider.authenticate(new OidcAuthenticationToken("ticket-value"));

        assertThat(authentication.getPrincipal()).isInstanceOf(OidcUserDetails.class);
        verify(userService, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private OidcIdentity identity() {
        return new OidcIdentity("subject-1", "alice@example.com", List.of("oc-admins"),
                Map.of("email", "alice@example.com"));
    }
}

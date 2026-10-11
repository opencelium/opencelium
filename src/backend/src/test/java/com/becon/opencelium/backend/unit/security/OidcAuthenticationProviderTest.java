/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.security.oidc.OidcAuthenticationProvider;
import com.becon.opencelium.backend.security.oidc.OidcAuthenticationToken;
import com.becon.opencelium.backend.security.oidc.OidcIdentity;
import com.becon.opencelium.backend.security.oidc.OidcLoginException;
import com.becon.opencelium.backend.security.oidc.OidcLoginService;
import com.becon.opencelium.backend.security.oidc.OidcUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Run with: ./gradlew test --tests "*.OidcAuthenticationProviderTest"
 */
@DisplayName("OidcAuthenticationProvider — ticket to authentication")
class OidcAuthenticationProviderTest {

    private static final String ISSUER = "https://idp.example.com";
    private static final String EMAIL = "alice@example.com";

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
    void authenticateReturnsTheLinkedAccountWithGroupAuthorities() {
        User linked = user(7, EMAIL);
        when(oidcLoginService.consumeTicket("ticket-value")).thenReturn(identity());
        when(userService.findByOidcIdentity(ISSUER, "subject-1")).thenReturn(Optional.of(linked));

        OidcUserDetails principal = principalOf(provider.authenticate(new OidcAuthenticationToken("ticket-value")));

        assertThat(principal.getUser()).isSameAs(linked);
        assertThat(principal.getEmail()).isEqualTo(EMAIL);
        assertThat(principal.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("oc-admins");
        // The email is only ever consulted when nothing is linked to the identity.
        verify(userService, never()).findByEmail(anyString());
    }

    @Test
    void authenticateRelinksAnAccountByEmailWhenWeakMatchingIsEnabled() {
        properties.setWeakMatching(true);
        User moved = user(7, EMAIL);
        moved.setOidcIssuer("https://old-idp.example.com");
        moved.setOidcSubject("old-subject");
        when(oidcLoginService.consumeTicket("ticket-value")).thenReturn(identity());
        when(userService.findByEmail(EMAIL)).thenReturn(Optional.of(moved));

        OidcUserDetails principal = principalOf(provider.authenticate(new OidcAuthenticationToken("ticket-value")));

        assertThat(principal.getUser()).isSameAs(moved);
        assertThat(moved.getOidcIssuer()).isEqualTo(ISSUER);
        assertThat(moved.getOidcSubject()).isEqualTo("subject-1");
    }

    @Test
    void authenticateThrowsWhenTheAccountExistsButIsNotLinkedAndWeakMatchingIsOff() {
        when(oidcLoginService.consumeTicket("ticket-value")).thenReturn(identity());
        when(userService.findByEmail(EMAIL)).thenReturn(Optional.of(user(7, EMAIL)));

        assertThatThrownBy(() -> provider.authenticate(new OidcAuthenticationToken("ticket-value")))
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "account_not_linked");
    }

    @Test
    void authenticateReturnsNoAccountWhenNothingIsLinkedAndJitProvisioningIsEnabled() {
        when(oidcLoginService.consumeTicket("ticket-value")).thenReturn(identity());
        when(userService.findByOidcIdentity(ISSUER, "subject-1")).thenReturn(Optional.empty());
        when(userService.findByEmail(EMAIL)).thenReturn(Optional.empty());

        OidcUserDetails principal = principalOf(provider.authenticate(new OidcAuthenticationToken("ticket-value")));

        // No account: AuthenticationFilter provisions one.
        assertThat(principal.getUser()).isNull();
        verify(userService, never()).save(any());
    }

    @Test
    void authenticateThrowsWhenUserIsUnknownAndJitProvisioningIsDisabled() {
        properties.setJitProvisioning(false);
        when(oidcLoginService.consumeTicket("ticket-value")).thenReturn(identity());
        when(userService.findByOidcIdentity(ISSUER, "subject-1")).thenReturn(Optional.empty());
        when(userService.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> provider.authenticate(new OidcAuthenticationToken("ticket-value")))
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "user_not_provisioned");
    }

    @Test
    void authenticateThrowsWhenTicketWasAlreadyConsumed() {
        when(oidcLoginService.consumeTicket("used-ticket"))
                .thenThrow(new OidcLoginException("invalid_code", "The one-time code has expired or was already used."));

        assertThatThrownBy(() -> provider.authenticate(new OidcAuthenticationToken("used-ticket")))
                .isInstanceOf(OidcLoginException.class);
    }

    private OidcUserDetails principalOf(Authentication authentication) {
        assertThat(authentication.getPrincipal()).isInstanceOf(OidcUserDetails.class);

        return (OidcUserDetails) authentication.getPrincipal();
    }

    private OidcIdentity identity() {
        return new OidcIdentity(ISSUER, "subject-1", EMAIL, List.of("oc-admins"), Map.of("email", EMAIL));
    }

    private User user(int id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);

        return user;
    }
}

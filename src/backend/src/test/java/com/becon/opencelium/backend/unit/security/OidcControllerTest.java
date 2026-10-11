/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.controller.OidcController;
import com.becon.opencelium.backend.security.oidc.OidcAuthorizationState;
import com.becon.opencelium.backend.security.oidc.OidcIdentity;
import com.becon.opencelium.backend.security.oidc.OidcLoginException;
import com.becon.opencelium.backend.security.oidc.OidcLoginService;
import com.becon.opencelium.backend.security.oidc.OidcStateCookieService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Run with: ./gradlew test --tests "*.OidcControllerTest"
 *
 * The callback is reached by the browser, so every failure has to come back as a redirect to the
 * frontend - a raw error page would leave the user on a dead end.
 */
@DisplayName("OidcController — the browser is always sent back to the frontend")
class OidcControllerTest {

    private static final String FRONTEND_REDIRECT = "http://localhost:5173/oidc/callback";

    /** Fixed instant: a value derived from the clock would make two equal states differ occasionally. */
    private static final long STATE_EXPIRES_AT = 1_800_000_000_000L;

    private final OidcLoginService oidcLoginService = mock(OidcLoginService.class);
    private final OidcStateCookieService stateCookieService = mock(OidcStateCookieService.class);
    private final OidcProperties properties = new OidcProperties();

    private OidcController controller;

    @BeforeEach
    void setUp() {
        properties.setEnabled(true);
        properties.setFrontendRedirectUri(FRONTEND_REDIRECT);
        controller = new OidcController(properties, oidcLoginService, stateCookieService);
    }

    @Test
    void callbackHandsTheOneTimeCodeToTheFrontend() {
        when(stateCookieService.read(any())).thenReturn(Optional.of(state()));
        when(oidcLoginService.completeLogin("auth-code", "state-value", state())).thenReturn(identity());
        when(oidcLoginService.issueTicket(identity(), "client-nonce-hash-value")).thenReturn("ticket-value");

        ResponseEntity<Void> response = callback("auth-code", "state-value");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(response.getHeaders().getLocation()).hasToString(FRONTEND_REDIRECT + "?code=ticket-value");
    }

    @Test
    void callbackReportsTheCodeOfAKnownFailure() {
        when(stateCookieService.read(any())).thenReturn(Optional.empty());
        when(oidcLoginService.completeLogin(any(), any(), any()))
                .thenThrow(new OidcLoginException("invalid_state", "state does not match"));

        ResponseEntity<Void> response = callback("auth-code", "another-state");

        assertThat(response.getHeaders().getLocation()).hasToString(FRONTEND_REDIRECT + "?error=invalid_state");
    }

    @Test
    void callbackTurnsAnUnexpectedFailureIntoAGenericCode() {
        when(stateCookieService.read(any())).thenReturn(Optional.empty());
        // What a callback without 'code' and without 'error' ends up doing inside the service.
        when(oidcLoginService.completeLogin(any(), any(), any()))
                .thenThrow(new IllegalArgumentException("code cannot be empty"));

        ResponseEntity<Void> response = callback(null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(response.getHeaders().getLocation()).hasToString(FRONTEND_REDIRECT + "?error=callback_failed");
    }

    @Test
    void callbackTurnsABrokenIdTokenDecoderIntoAGenericCode() {
        when(stateCookieService.read(any())).thenReturn(Optional.of(state()));
        when(oidcLoginService.completeLogin(any(), any(), any()))
                .thenThrow(new IllegalStateException("No JWK set uri was configured"));

        ResponseEntity<Void> response = callback("auth-code", "state-value");

        assertThat(response.getHeaders().getLocation()).hasToString(FRONTEND_REDIRECT + "?error=callback_failed");
    }

    @Test
    void authorizeReportsAnUnreachableIdentityProviderAsAGenericCode() {
        when(oidcLoginService.beginLogin("client-nonce"))
                .thenThrow(new IllegalStateException("discovery document not reachable"));

        ResponseEntity<Void> response = controller.authorize("client-nonce",
                new MockHttpServletRequest(), new MockHttpServletResponse());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(response.getHeaders().getLocation()).hasToString(FRONTEND_REDIRECT + "?error=authorize_failed");
    }

    @Test
    void authorizeRejectsAClientNonceTheServiceRefuses() {
        when(oidcLoginService.beginLogin("short")).thenThrow(new OidcLoginException("invalid_nonce", "too short"));

        ResponseEntity<Void> response = controller.authorize("short",
                new MockHttpServletRequest(), new MockHttpServletResponse());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void authorizeWritesTheStateCookieAndRedirectsToTheProvider() {
        when(oidcLoginService.beginLogin("client-nonce"))
                .thenReturn(new OidcLoginService.Start(state(), "https://idp.example.com/authorize?state=state-value"));

        ResponseEntity<Void> response = controller.authorize("client-nonce",
                new MockHttpServletRequest(), new MockHttpServletResponse());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(response.getHeaders().getLocation()).hasToString("https://idp.example.com/authorize?state=state-value");
        // Plain http in the test, hence secure = false, and the cookie test covers the header itself.
        verify(stateCookieService).write(any(), eq(state()), eq(false));
    }

    private ResponseEntity<Void> callback(String code, String state) {
        return controller.callback(code, state, null, new MockHttpServletRequest(), new MockHttpServletResponse());
    }

    private OidcAuthorizationState state() {
        return new OidcAuthorizationState("state-value", "nonce-value", "verifier-value",
                "http://localhost:9090/oidc/callback", "client-nonce-hash-value", STATE_EXPIRES_AT);
    }

    private OidcIdentity identity() {
        return new OidcIdentity("https://idp.example.com", "subject-1", "alice@example.com", List.of("oc-users"));
    }
}

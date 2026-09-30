/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.security.oidc.OidcAuthorizationState;
import com.becon.opencelium.backend.security.oidc.OidcStateCookieService;
import com.becon.opencelium.backend.utility.TokenUtility;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The authorization state travels in a signed cookie because the session policy is STATELESS,
 * so tampering and expiry both have to be rejected here rather than by a session store.
 *
 * Run with: ./gradlew test --tests "*.OidcStateCookieServiceTest"
 */
@DisplayName("OidcStateCookieService — signed authorization state")
class OidcStateCookieServiceTest {

    private OidcStateCookieService cookieService;

    @BeforeEach
    void setUp() {
        TokenUtility tokenUtility = mock(TokenUtility.class);
        when(tokenUtility.getSecret()).thenReturn("test-secret");

        cookieService = new OidcStateCookieService(new ObjectMapper().findAndRegisterModules(), tokenUtility);
    }

    @Test
    void readReturnsStateWhenCookieIsUntouched() {
        OidcAuthorizationState state = stateExpiringIn(60_000);
        MockHttpServletRequest request = roundTrip(state);

        assertThat(cookieService.read(request)).contains(state);
    }

    @Test
    void readReturnsEmptyWhenPayloadWasTamperedWith() {
        MockHttpServletRequest request = roundTrip(stateExpiringIn(60_000));
        Cookie cookie = request.getCookies()[0];
        cookie.setValue(tamperWithPayload(cookie.getValue()));

        assertThat(cookieService.read(request)).isEmpty();
    }

    @Test
    void readReturnsEmptyWhenSignatureWasTamperedWith() {
        MockHttpServletRequest request = roundTrip(stateExpiringIn(60_000));
        Cookie cookie = request.getCookies()[0];
        String value = cookie.getValue();
        cookie.setValue(value.substring(0, value.length() - 1) + (value.endsWith("A") ? "B" : "A"));

        assertThat(cookieService.read(request)).isEmpty();
    }

    @Test
    void readReturnsEmptyWhenStateHasExpired() {
        MockHttpServletRequest request = roundTrip(stateExpiringIn(-1_000));

        assertThat(cookieService.read(request)).isEmpty();
    }

    @Test
    void readReturnsEmptyWhenNoCookieIsPresent() {
        assertThat(cookieService.read(new MockHttpServletRequest())).isEmpty();
    }

    @Test
    void readReturnsEmptyWhenCookieWasSignedWithAnotherSecret() {
        MockHttpServletRequest request = roundTrip(stateExpiringIn(60_000));

        TokenUtility otherSecret = mock(TokenUtility.class);
        when(otherSecret.getSecret()).thenReturn("another-secret");
        OidcStateCookieService otherService =
                new OidcStateCookieService(new ObjectMapper().findAndRegisterModules(), otherSecret);

        assertThat(otherService.read(request)).isEmpty();
    }

    private OidcAuthorizationState stateExpiringIn(long millis) {
        return new OidcAuthorizationState("state-value", "nonce-value", "verifier-value",
                "http://localhost:9090/oidc/callback", System.currentTimeMillis() + millis);
    }

    /** Writes the cookie and turns the emitted Set-Cookie header into a request that carries it. */
    private MockHttpServletRequest roundTrip(OidcAuthorizationState state) {
        MockHttpServletResponse response = new MockHttpServletResponse();
        cookieService.write(response, state, false);

        String setCookie = response.getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();

        String prefix = OidcStateCookieService.COOKIE_NAME + "=";
        String value = setCookie.substring(prefix.length(), setCookie.indexOf(';'));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(OidcStateCookieService.COOKIE_NAME, value));

        return request;
    }

    private String tamperWithPayload(String value) {
        int separator = value.lastIndexOf('.');
        String payload = value.substring(0, separator);
        String signature = value.substring(separator + 1);
        char last = payload.charAt(payload.length() - 1);

        return payload.substring(0, payload.length() - 1) + (last == 'A' ? 'B' : 'A') + "." + signature;
    }
}

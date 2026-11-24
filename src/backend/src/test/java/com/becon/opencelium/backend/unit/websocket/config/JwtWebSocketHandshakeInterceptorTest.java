/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.websocket.config;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.websocket.config.JwtWebSocketHandshakeInterceptor;
import com.nimbusds.jwt.JWTClaimsSet;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.socket.WebSocketHandler;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static com.becon.opencelium.backend.websocket.config.JwtWebSocketHandshakeInterceptor.OC_SESSION_ID_ATTRIBUTE;
import static com.becon.opencelium.backend.websocket.config.JwtWebSocketHandshakeInterceptor.PRINCIPAL_NAME_ATTRIBUTE;
import static com.becon.opencelium.backend.websocket.config.JwtWebSocketHandshakeInterceptor.USER_ID_ATTRIBUTE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link JwtWebSocketHandshakeInterceptor}: which handshakes are accepted and
 * which attributes the STOMP layer receives. Token parsing is covered by the token utility's own
 * test; here it is mocked so each test pins one decision of the interceptor.
 */
@ExtendWith(MockitoExtension.class)
class JwtWebSocketHandshakeInterceptorTest {

    private static final String TOKEN = "signed-token";

    @Mock
    JwtTokenUtil jwtTokenUtil;

    @Mock
    UserService userService;

    @Mock
    WebSocketHandler wsHandler;

    @InjectMocks
    JwtWebSocketHandshakeInterceptor interceptor;

    private final Map<String, Object> attributes = new HashMap<>();
    private final ServerHttpResponse response = new ServletServerHttpResponse(new MockHttpServletResponse());

    @Test
    void beforeHandshakeStoresUserAttributesWhenTokenIsValid() {
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-5");
        User user = aUser(5, "alice@example.com");
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.of(5));
        when(userService.findByIdNoLock(5)).thenReturn(Optional.of(user));
        when(jwtTokenUtil.belongsToActiveSession(claims, user)).thenReturn(true);

        boolean accepted = interceptor.beforeHandshake(requestWithToken("Bearer " + TOKEN), response, wsHandler, attributes);

        assertThat(accepted).isTrue();
        assertThat(attributes)
                .containsEntry(USER_ID_ATTRIBUTE, 5)
                .containsEntry(OC_SESSION_ID_ATTRIBUTE, "session-5")
                .containsEntry(PRINCIPAL_NAME_ATTRIBUTE, "alice@example.com");
    }

    @Test
    void beforeHandshakeTakesPrincipalFromUserNotFromTokenSubject() {
        JWTClaimsSet claims = claimsFor("stale@example.com", "session-5");
        User user = aUser(5, "fresh@example.com");
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.of(5));
        when(userService.findByIdNoLock(5)).thenReturn(Optional.of(user));
        when(jwtTokenUtil.belongsToActiveSession(claims, user)).thenReturn(true);

        boolean accepted = interceptor.beforeHandshake(requestWithToken("Bearer " + TOKEN), response, wsHandler, attributes);

        assertThat(accepted).isTrue();
        assertThat(attributes).containsEntry(PRINCIPAL_NAME_ATTRIBUTE, "fresh@example.com");
    }

    @Test
    void beforeHandshakeRejectsWhenTokenParameterIsAbsent() {
        ServerHttpRequest request = new ServletServerHttpRequest(new MockHttpServletRequest());

        boolean accepted = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertThat(accepted).isFalse();
        assertThat(attributes).isEmpty();
        verifyNoInteractions(jwtTokenUtil, userService);
    }

    @Test
    void beforeHandshakeRejectsWhenTokenIsNotBearer() {
        boolean accepted = interceptor.beforeHandshake(requestWithToken(TOKEN), response, wsHandler, attributes);

        assertThat(accepted).isFalse();
        assertThat(attributes).isEmpty();
        verifyNoInteractions(jwtTokenUtil, userService);
    }

    @Test
    void beforeHandshakeRejectsWhenSignatureIsInvalid() {
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.empty());

        boolean accepted = interceptor.beforeHandshake(requestWithToken("Bearer " + TOKEN), response, wsHandler, attributes);

        assertThat(accepted).isFalse();
        assertThat(attributes).isEmpty();
        verifyNoInteractions(userService);
    }

    @Test
    void beforeHandshakeRejectsWhenUserDoesNotExist() {
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-5");
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.of(5));
        when(userService.findByIdNoLock(5)).thenReturn(Optional.empty());

        boolean accepted = interceptor.beforeHandshake(requestWithToken("Bearer " + TOKEN), response, wsHandler, attributes);

        assertThat(accepted).isFalse();
        assertThat(attributes).isEmpty();
    }

    @Test
    void beforeHandshakeRejectsWhenTokenDoesNotBelongToActiveSession() {
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-5");
        User user = aUser(5, "alice@example.com");
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.of(5));
        when(userService.findByIdNoLock(5)).thenReturn(Optional.of(user));
        when(jwtTokenUtil.belongsToActiveSession(claims, user)).thenReturn(false);

        boolean accepted = interceptor.beforeHandshake(requestWithToken("Bearer " + TOKEN), response, wsHandler, attributes);

        assertThat(accepted).isFalse();
        assertThat(attributes).isEmpty();
    }

    @Test
    void beforeHandshakeRejectsWhenRequestIsNotServletBased() {
        ServerHttpRequest request = mock(ServerHttpRequest.class);

        boolean accepted = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertThat(accepted).isFalse();
        assertThat(attributes).isEmpty();
        verifyNoInteractions(jwtTokenUtil, userService);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static ServerHttpRequest requestWithToken(String token) {
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setParameter("token", token);
        return new ServletServerHttpRequest(servletRequest);
    }

    private static JWTClaimsSet claimsFor(String subject, String sessionId) {
        return new JWTClaimsSet.Builder().subject(subject).jwtID(sessionId).claim("userId", 5).build();
    }

    private static User aUser(int id, String email) {
        User user = UserFixture.anEmptyUser();
        user.setId(id);
        user.setEmail(email);
        return user;
    }
}

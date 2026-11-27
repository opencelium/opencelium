/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.SessionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import com.nimbusds.jwt.JWTClaimsSet;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AuthorizationFilter}: the order of checks on a bearer token and what
 * ends up in the security context. Token parsing itself is covered by {@link JwtTokenUtilTest};
 * here the utility is mocked so each test pins one decision of the filter.
 */
@ExtendWith(MockitoExtension.class)
class AuthorizationFilterTest {

    private static final String TOKEN = "signed-token";
    private static final String SESSION_ID = "session-5";

    @Mock
    JwtTokenUtil jwtTokenUtil;

    @Mock
    UserService userService;

    @Mock
    SessionServiceImpl sessionService;

    AuthorizationFilter filter;

    @BeforeEach
    void createFilter() {
        filter = new AuthorizationFilter(jwtTokenUtil, userService, sessionService, "/ws");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterLeavesContextEmptyWhenAuthorizationHeaderIsAbsent() throws Exception {
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verifyNoInteractions(jwtTokenUtil, userService, sessionService);
    }

    @Test
    void doFilterLeavesContextEmptyWhenHeaderIsNotBearer() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic not-a-bearer-token");
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verifyNoInteractions(jwtTokenUtil, userService, sessionService);
    }

    @Test
    void doFilterAuthenticatesUserWhenTokenIsValid() throws Exception {
        JWTClaimsSet claims = claimsFor(SESSION_ID);
        User user = aUser(5);
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.of(5));
        when(userService.findByIdNoLock(5)).thenReturn(Optional.of(user));
        when(jwtTokenUtil.belongsToActiveSession(claims, user)).thenReturn(true);
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(bearerRequest(), new MockHttpServletResponse(), chain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getPrincipal()).isInstanceOf(UserPrincipals.class);
        assertThat(((UserPrincipals) authentication.getPrincipal()).getUser()).isSameAs(user);
        assertThat(authentication.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly(user.getUserRole().getName());
        assertThat(chain.getRequest()).isNotNull();
        verify(sessionService).updateLastAccessedTime(SESSION_ID);
    }

    @Test
    void doFilterSkipsUserLookupWhenSignatureIsInvalid() throws Exception {
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.empty());
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(bearerRequest(), new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verifyNoInteractions(userService, sessionService);
    }

    @Test
    void doFilterLeavesContextEmptyWhenUserIdClaimIsMissing() throws Exception {
        JWTClaimsSet claims = claimsFor(SESSION_ID);
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.empty());
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(bearerRequest(), new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verifyNoInteractions(userService, sessionService);
    }

    @Test
    void doFilterLeavesContextEmptyWhenUserDoesNotExist() throws Exception {
        JWTClaimsSet claims = claimsFor(SESSION_ID);
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.of(5));
        when(userService.findByIdNoLock(5)).thenReturn(Optional.empty());
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(bearerRequest(), new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verify(jwtTokenUtil, never()).belongsToActiveSession(any(), any());
        verifyNoInteractions(sessionService);
    }

    @Test
    void doFilterLeavesContextEmptyWhenTokenDoesNotBelongToActiveSession() throws Exception {
        JWTClaimsSet claims = claimsFor(SESSION_ID);
        User user = aUser(5);
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.of(5));
        when(userService.findByIdNoLock(5)).thenReturn(Optional.of(user));
        when(jwtTokenUtil.belongsToActiveSession(claims, user)).thenReturn(false);
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(bearerRequest(), new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verifyNoInteractions(sessionService);
    }

    // ── token in the URL: the WebSocket endpoint only ─────────────────────────

    @ParameterizedTest
    @DisplayName("doFilter — a browser cannot set headers on a WebSocket, so the SockJS paths take ?token=")
    @ValueSource(strings = {"/ws", "/ws/info", "/ws/123/abcdef/websocket", "/ws/123/abcdef/xhr_send"})
    void doFilterReadsTokenFromQueryParameterWhenRequestGoesToWebSocketEndpoint(String path) throws Exception {
        User user = givenValidTokenOf(aUser(5));

        filter.doFilter(tokenInUrlRequest(path), new MockHttpServletResponse(), new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(((UserPrincipals) authentication.getPrincipal()).getUser()).isSameAs(user);
    }

    @ParameterizedTest
    @DisplayName("doFilter — any other path ignores ?token=, even one that only starts like the endpoint")
    @ValueSource(strings = {"/connection/all", "/user/5", "/wsx", "/ws-admin/info", "/api/ws", ""})
    void doFilterIgnoresTokenQueryParameterWhenRequestGoesElsewhere(String path) throws Exception {
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(tokenInUrlRequest(path), new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verifyNoInteractions(jwtTokenUtil, userService, sessionService);
    }

    @Test
    void doFilterReadsTokenFromQueryParameterWhenPathInfoHoldsRestOfWebSocketPath() throws Exception {
        givenValidTokenOf(aUser(5));
        MockHttpServletRequest request = tokenInUrlRequest("/ws");
        request.setPathInfo("/info");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    @ParameterizedTest
    @DisplayName("constructor — '/ws', 'ws' and '/ws/' all name the endpoint /ws")
    @ValueSource(strings = {"/ws", "ws", "/ws/", " /ws "})
    void constructorAcceptsEndpointWhenSlashesDiffer(String endpoint) throws Exception {
        givenValidTokenOf(aUser(5));
        AuthorizationFilter configured = new AuthorizationFilter(jwtTokenUtil, userService, sessionService, endpoint);

        configured.doFilter(tokenInUrlRequest("/ws/info"), new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    @ParameterizedTest
    @DisplayName("constructor — the root path would let ?token= authenticate every request, so it is refused")
    @ValueSource(strings = {"/", "", "//"})
    void constructorThrowsWhenEndpointIsRootPath(String endpoint) {
        assertThatThrownBy(() -> new AuthorizationFilter(jwtTokenUtil, userService, sessionService, endpoint))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("websocket.endpoint");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static MockHttpServletRequest bearerRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + TOKEN);
        return request;
    }

    /** A request to {@code servletPath} without an Authorization header, carrying ?token=Bearer …. */
    private static MockHttpServletRequest tokenInUrlRequest(String servletPath) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", servletPath);
        request.setServletPath(servletPath);
        request.setParameter("token", "Bearer " + TOKEN);
        return request;
    }

    /** Makes {@link #TOKEN} a valid token of {@code user}'s active session. */
    private User givenValidTokenOf(User user) {
        JWTClaimsSet claims = claimsFor(SESSION_ID);
        when(jwtTokenUtil.verify(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtTokenUtil.userIdOf(claims)).thenReturn(Optional.of(user.getId()));
        when(userService.findByIdNoLock(user.getId())).thenReturn(Optional.of(user));
        when(jwtTokenUtil.belongsToActiveSession(claims, user)).thenReturn(true);
        return user;
    }

    private static JWTClaimsSet claimsFor(String sessionId) {
        return new JWTClaimsSet.Builder().jwtID(sessionId).claim("userId", 5).build();
    }

    private static User aUser(int id) {
        User user = UserFixture.anEmptyUser();
        user.setId(id);
        user.setEmail("alice@example.com");
        user.setUserRole(UserRoleFixture.aStandardUserRole());
        return user;
    }
}

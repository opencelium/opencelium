/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.configuration.LdapProperties;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.service.SessionService;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import com.becon.opencelium.backend.security.LoginRateLimiter;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.becon.opencelium.backend.testutil.fixture.SessionFixture;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the password login of {@link AuthenticationFilter}: how the identifier is read
 * from the request body, and how failed logins are rate limited. Parsing is tested on
 * {@code attemptAuthentication} directly; rate limiting runs through {@code doFilter}, because
 * failures are counted in the filter's failure handler. The rate limiter is real, with a clock the
 * tests move forward.
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationFilterTest {

    private static final String CLIENT = "203.0.113.7";
    private static final String OTHER_CLIENT = "198.51.100.9";
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_FAILURES_PER_ACCOUNT = 2;
    private static final int MAX_FAILURES_PER_CLIENT = 3;

    @Mock
    AuthenticationManager authenticationManager;

    @Mock
    SessionService sessionService;

    @Mock
    JwtTokenUtil jwtTokenUtil;

    @Mock
    LdapProperties ldapProperties;

    @Mock
    SubscriptionService subscriptionService;

    @Mock
    SimpMessagingTemplate messagingTemplate;

    private final MutableClock clock = new MutableClock(Instant.parse("2026-11-11T10:00:00Z"));
    private AuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthenticationFilter();
        filter.setAuthenticationManager(authenticationManager);
        ReflectionTestUtils.setField(filter, "loginRateLimiter",
                new LoginRateLimiter(MAX_FAILURES_PER_ACCOUNT, MAX_FAILURES_PER_CLIENT, WINDOW, clock));
        ReflectionTestUtils.setField(filter, "sessionService", sessionService);
        ReflectionTestUtils.setField(filter, "jwtTokenUtil", jwtTokenUtil);
        ReflectionTestUtils.setField(filter, "properties", ldapProperties);
        ReflectionTestUtils.setField(filter, "subscriptionService", subscriptionService);
        ReflectionTestUtils.setField(filter, "messagingTemplate", messagingTemplate);
    }

    @AfterEach
    void resetRequestContext() {
        RequestContextHolder.resetRequestAttributes();
    }

    // ── attemptAuthentication: reading the identifier ─────────────────────────

    @Test
    void attemptAuthenticationUsesIdentifierKeyWhenSeveralKeysAreSent() {
        echoAuthenticationRequests();

        Authentication result = filter.attemptAuthentication(
                login("{\"identifier\":\"bob\",\"username\":\"robert\",\"email\":\"alice@example.com\",\"password\":\"pw\"}"),
                new MockHttpServletResponse());

        assertThat(result.getName()).isEqualTo("bob");
    }

    @Test
    void attemptAuthenticationUsesUsernameKeyWhenIdentifierIsAbsent() {
        echoAuthenticationRequests();

        Authentication result = filter.attemptAuthentication(
                login("{\"username\":\"robert\",\"email\":\"alice@example.com\",\"password\":\"pw\"}"),
                new MockHttpServletResponse());

        assertThat(result.getName()).isEqualTo("robert");
    }

    @Test
    @DisplayName("attemptAuthentication — clients built before username login send the typed value as 'email'")
    void attemptAuthenticationUsesLegacyEmailKeyWhenItHoldsUsername() {
        echoAuthenticationRequests();

        Authentication result = filter.attemptAuthentication(
                login("{\"email\":\"bob\",\"password\":\"pw\"}"), new MockHttpServletResponse());

        assertThat(result.getName()).isEqualTo("bob");
    }

    @Test
    void attemptAuthenticationSkipsBlankKeysWhenResolvingIdentifier() {
        echoAuthenticationRequests();

        Authentication result = filter.attemptAuthentication(
                login("{\"identifier\":\"   \",\"username\":\"\",\"email\":\"bob\",\"password\":\"pw\"}"),
                new MockHttpServletResponse());

        assertThat(result.getName()).isEqualTo("bob");
    }

    @Test
    void attemptAuthenticationTrimsIdentifierWhenItHasSurroundingWhitespace() {
        echoAuthenticationRequests();

        Authentication result = filter.attemptAuthentication(
                login("{\"email\":\"  bob  \",\"password\":\"pw\"}"), new MockHttpServletResponse());

        assertThat(result.getName()).isEqualTo("bob");
    }

    @Test
    void attemptAuthenticationKeepsPasswordUnchangedWhenItHasSurroundingWhitespace() {
        echoAuthenticationRequests();

        Authentication result = filter.attemptAuthentication(
                login("{\"email\":\"bob\",\"password\":\" pw \"}"), new MockHttpServletResponse());

        assertThat(result.getCredentials()).isEqualTo(" pw ");
    }

    @Test
    void attemptAuthenticationPassesUnauthenticatedTokenWhenBodyIsValid() {
        echoAuthenticationRequests();

        Authentication result = filter.attemptAuthentication(
                login("{\"email\":\"bob\",\"password\":\"pw\"}"), new MockHttpServletResponse());

        assertThat(result).isInstanceOf(UsernamePasswordAuthenticationToken.class);
        assertThat(result.isAuthenticated()).isFalse();
    }

    @Test
    void attemptAuthenticationIgnoresUnknownKeysWhenBodyHasExtraFields() {
        echoAuthenticationRequests();

        Authentication result = filter.attemptAuthentication(
                login("{\"email\":\"bob\",\"password\":\"pw\",\"userId\":3,\"rememberMe\":true}"),
                new MockHttpServletResponse());

        assertThat(result.getName()).isEqualTo("bob");
    }

    @Test
    void attemptAuthenticationThrowsWhenBodyIsNotJson() {
        MockHttpServletRequest request = login("email=bob&password=pw");

        assertThatThrownBy(() -> filter.attemptAuthentication(request, new MockHttpServletResponse()))
                .isInstanceOf(AuthenticationServiceException.class)
                .hasMessage("Malformed login request");

        verifyNoInteractions(authenticationManager);
    }

    @Test
    void attemptAuthenticationThrowsWhenBodyIsJsonArray() {
        MockHttpServletRequest request = login("[\"bob\",\"pw\"]");

        assertThatThrownBy(() -> filter.attemptAuthentication(request, new MockHttpServletResponse()))
                .isInstanceOf(AuthenticationServiceException.class)
                .hasMessage("Malformed login request");

        verifyNoInteractions(authenticationManager);
    }

    @Test
    void attemptAuthenticationThrowsWhenBodyIsEmpty() {
        MockHttpServletRequest request = login("");

        assertThatThrownBy(() -> filter.attemptAuthentication(request, new MockHttpServletResponse()))
                .isInstanceOf(AuthenticationServiceException.class)
                .hasMessage("Malformed login request");

        verifyNoInteractions(authenticationManager);
    }

    @Test
    void attemptAuthenticationThrowsWhenMethodIsNotPost() {
        MockHttpServletRequest request = login("{\"email\":\"bob\",\"password\":\"pw\"}");
        request.setMethod("GET");

        assertThatThrownBy(() -> filter.attemptAuthentication(request, new MockHttpServletResponse()))
                .isInstanceOf(AuthenticationServiceException.class)
                .hasMessage("Authentication method not supported: GET");

        verifyNoInteractions(authenticationManager);
    }

    // ── doFilter: responses and rate limiting ─────────────────────────────────

    @Test
    void doFilterRespondsForbiddenWhenPasswordIsWrong() throws Exception {
        rejectAllPasswords();

        MockHttpServletResponse response = send(loginAs("bob", CLIENT));

        assertThat(response.getStatus()).isEqualTo(403);
    }

    @Test
    void doFilterIssuesTokenWhenPasswordIsCorrect() throws Exception {
        User user = aUser();
        acceptAs(user);
        when(authenticationManager.authenticate(any())).thenReturn(authenticated(user));

        MockHttpServletResponse response = send(loginAs("bob", CLIENT));

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getHeader("Authorization")).isEqualTo("Bearer signed-token");
    }

    @Test
    void doFilterRespondsTooManyRequestsWhenAccountReachedFailureLimit() throws Exception {
        rejectAllPasswords();
        send(loginAs("bob", CLIENT));
        send(loginAs("bob", CLIENT));

        MockHttpServletResponse response = send(loginAs("bob", CLIENT));

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo(String.valueOf(WINDOW.toSeconds()));
        assertThat(response.getContentAsString()).contains("Too many failed login attempts");
        verify(authenticationManager, times(MAX_FAILURES_PER_ACCOUNT)).authenticate(any());
    }

    @Test
    void doFilterAllowsAttemptAgainWhenOldestFailureLeftWindow() throws Exception {
        rejectAllPasswords();
        send(loginAs("bob", CLIENT));
        send(loginAs("bob", CLIENT));
        clock.advance(WINDOW);

        MockHttpServletResponse response = send(loginAs("bob", CLIENT));

        assertThat(response.getStatus()).isEqualTo(403);
        verify(authenticationManager, times(MAX_FAILURES_PER_ACCOUNT + 1)).authenticate(any());
    }

    @Test
    void doFilterCountsAccountCaseInsensitivelyWhenIdentifierCaseVaries() throws Exception {
        rejectAllPasswords();
        send(loginAs("bob", CLIENT));
        send(loginAs("BOB", CLIENT));

        MockHttpServletResponse response = send(loginAs("Bob", CLIENT));

        assertThat(response.getStatus()).isEqualTo(429);
    }

    @Test
    void doFilterRespondsTooManyRequestsWhenClientReachedFailureLimit() throws Exception {
        rejectAllPasswords();
        send(loginAs("anna", CLIENT));
        send(loginAs("bert", CLIENT));
        send(loginAs("carl", CLIENT));

        MockHttpServletResponse response = send(loginAs("dora", CLIENT));

        assertThat(response.getStatus()).isEqualTo(429);
        verify(authenticationManager, times(MAX_FAILURES_PER_CLIENT)).authenticate(any());
    }

    @Test
    void doFilterAllowsOtherClientWhenOneClientIsBlocked() throws Exception {
        rejectAllPasswords();
        send(loginAs("anna", CLIENT));
        send(loginAs("bert", CLIENT));
        send(loginAs("carl", CLIENT));

        MockHttpServletResponse response = send(loginAs("dora", OTHER_CLIENT));

        assertThat(response.getStatus()).isEqualTo(403);
        verify(authenticationManager, times(MAX_FAILURES_PER_CLIENT + 1)).authenticate(any());
    }

    @Test
    void doFilterDoesNotCountFailureWhenBodyIsMalformed() throws Exception {
        rejectAllPasswords();
        for (int i = 0; i < MAX_FAILURES_PER_CLIENT; i++) {
            send(withClient(login("not json"), CLIENT));
        }

        MockHttpServletResponse response = send(loginAs("bob", CLIENT));

        assertThat(response.getStatus()).isEqualTo(403);
        verify(authenticationManager).authenticate(any());
    }

    @Test
    @DisplayName("doFilter — refused attempts do not count, so a lockout cannot extend itself")
    void doFilterDoesNotExtendLockoutWhenAttemptIsRefused() throws Exception {
        rejectAllPasswords();
        send(loginAs("bob", CLIENT));
        send(loginAs("bob", CLIENT));
        clock.advance(Duration.ofMinutes(10));
        send(loginAs("bob", CLIENT));
        send(loginAs("bob", CLIENT));
        clock.advance(Duration.ofMinutes(5));

        MockHttpServletResponse response = send(loginAs("bob", CLIENT));

        assertThat(response.getStatus()).isEqualTo(403);
    }

    @Test
    void doFilterClearsAccountFailuresWhenLoginSucceeds() throws Exception {
        User user = aUser();
        acceptAs(user);
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"))
                .thenReturn(authenticated(user))
                .thenThrow(new BadCredentialsException("Bad credentials"));
        send(loginAs("bob", CLIENT));
        send(loginAs("bob", CLIENT));
        send(loginAs("bob", CLIENT));

        MockHttpServletResponse response = send(loginAs("bob", CLIENT));

        assertThat(response.getStatus()).isEqualTo(403);
        verify(authenticationManager, times(4)).authenticate(any());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private MockHttpServletResponse send(MockHttpServletRequest request) throws Exception {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        return response;
    }

    private void echoAuthenticationRequests() {
        when(authenticationManager.authenticate(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void rejectAllPasswords() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));
    }

    private void acceptAs(User user) {
        when(sessionService.replace(user.getId())).thenReturn(SessionFixture.aSessionWithId("session-5", user.getId()));
        when(ldapProperties.isShowLogs()).thenReturn("OFF");
        when(jwtTokenUtil.generateToken(user)).thenReturn("signed-token");
    }

    private static Authentication authenticated(User user) {
        return UsernamePasswordAuthenticationToken.authenticated(new UserPrincipals(user), null, List.of());
    }

    private static MockHttpServletRequest loginAs(String identifier, String client) {
        return withClient(login("{\"email\":\"" + identifier + "\",\"password\":\"pw\"}"), client);
    }

    private static MockHttpServletRequest withClient(MockHttpServletRequest request, String client) {
        request.setRemoteAddr(client);
        return request;
    }

    private static MockHttpServletRequest login(String body) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/login");
        request.setServletPath("/login");
        request.setRemoteAddr(CLIENT);
        request.setContentType("application/json");
        request.setContent(body.getBytes(StandardCharsets.UTF_8));
        return request;
    }

    private static User aUser() {
        User user = UserFixture.anEmptyUser();
        user.setId(5);
        user.setEmail("bob@example.com");
        user.setUsername("bob");
        user.setUserRole(UserRoleFixture.aStandardUserRole());
        UserDetail detail = new UserDetail();
        detail.setTutorial(false);
        detail.setUser(user);
        user.setUserDetail(detail);
        return user;
    }

    /** A clock the tests move forward; the rate limiter reads it on every call. */
    private static final class MutableClock extends Clock {

        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}

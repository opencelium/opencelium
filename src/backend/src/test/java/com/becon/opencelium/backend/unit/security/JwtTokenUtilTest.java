/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import com.becon.opencelium.backend.testutil.fixture.SessionFixture;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import com.becon.opencelium.backend.utility.TokenUtility;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.text.ParseException;
import java.util.Date;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link JwtTokenUtil}: real Nimbus signing and parsing against a mocked
 * {@link TokenUtility} that supplies the secret and the time windows.
 */
@ExtendWith(MockitoExtension.class)
class JwtTokenUtilTest {

    /** HS256 needs a 256-bit key; these are test values, not deployed secrets. */
    private static final String SERVER_SECRET = "unit-test-server-secret-with-32-bytes-minimum";
    private static final String OTHER_SECRET = "unit-test-foreign-secret-with-32-bytes-minimum";
    private static final long ACTIVITY_TIME_MS = 60_000L;
    private static final long ONE_MINUTE_MS = 60_000L;

    @Mock
    TokenUtility tokenUtility;

    @InjectMocks
    JwtTokenUtil jwtTokenUtil;

    // ── verify ────────────────────────────────────────────────────────────────

    @Test
    void verifyReturnsClaimsWhenTokenIsSignedWithServerSecret() {
        when(tokenUtility.getSecret()).thenReturn(SERVER_SECRET);
        String token = jwtTokenUtil.generateToken(claimsFor("alice@example.com", "session-7", 7));

        Optional<JWTClaimsSet> result = jwtTokenUtil.verify(token);

        assertThat(result).isPresent();
        assertThat(result.get().getSubject()).isEqualTo("alice@example.com");
        assertThat(result.get().getJWTID()).isEqualTo("session-7");
        assertThat(jwtTokenUtil.userIdOf(result.get())).contains(7);
    }

    @Test
    void verifyReturnsEmptyWhenSignatureUsesDifferentSecret() throws Exception {
        when(tokenUtility.getSecret()).thenReturn(SERVER_SECRET);
        String token = signWith(OTHER_SECRET, claimsFor("alice@example.com", "session-7", 7));

        Optional<JWTClaimsSet> result = jwtTokenUtil.verify(token);

        assertThat(result).isEmpty();
    }

    @Test
    void verifyReturnsEmptyWhenTokenHasNoSignature() {
        lenient().when(tokenUtility.getSecret()).thenReturn(SERVER_SECRET);
        String token = new PlainJWT(claimsFor("alice@example.com", "session-7", 7)).serialize();

        Optional<JWTClaimsSet> result = jwtTokenUtil.verify(token);

        assertThat(result).isEmpty();
    }

    @Test
    void verifyReturnsEmptyWhenTokenIsMalformed() {
        Optional<JWTClaimsSet> result = jwtTokenUtil.verify("not-a-jwt");

        assertThat(result).isEmpty();
    }

    // ── generateToken ─────────────────────────────────────────────────────────

    @Test
    void generateTokenCarriesUserIdSubjectAndSessionIdWhenUserHasSession() {
        when(tokenUtility.getSecret()).thenReturn(SERVER_SECRET);
        when(tokenUtility.getActivityTime()).thenReturn(ACTIVITY_TIME_MS);
        when(tokenUtility.getExpirationTime()).thenReturn(60L);
        User user = aUser(5, "alice@example.com", SessionFixture.aSessionWithId("session-5", 5));

        JWTClaimsSet claims = jwtTokenUtil.verify(jwtTokenUtil.generateToken(user)).orElseThrow();

        assertThat(jwtTokenUtil.userIdOf(claims)).contains(5);
        assertThat(claims.getSubject()).isEqualTo("alice@example.com");
        assertThat(claims.getJWTID()).isEqualTo("session-5");
        assertThat(claims.getClaim("role")).isEqualTo(user.getUserRole().getName());
        assertThat(claims.getExpirationTime()).isAfter(new Date());
    }

    // ── userIdOf ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("userIdOf — accepts the Long that Nimbus produces when parsing a numeric claim")
    void userIdOfReturnsIdWhenClaimIsNumber() {
        JWTClaimsSet claims = new JWTClaimsSet.Builder().claim("userId", 7L).build();

        assertThat(jwtTokenUtil.userIdOf(claims)).contains(7);
    }

    @Test
    void userIdOfReturnsIdWhenClaimIsNumericString() {
        JWTClaimsSet claims = new JWTClaimsSet.Builder().claim("userId", "7").build();

        assertThat(jwtTokenUtil.userIdOf(claims)).contains(7);
    }

    @Test
    void userIdOfReturnsEmptyWhenClaimIsMissing() {
        JWTClaimsSet claims = new JWTClaimsSet.Builder().subject("alice@example.com").build();

        assertThat(jwtTokenUtil.userIdOf(claims)).isEmpty();
    }

    @Test
    void userIdOfReturnsEmptyWhenClaimIsNotNumeric() {
        JWTClaimsSet claims = new JWTClaimsSet.Builder().claim("userId", "seven").build();

        assertThat(jwtTokenUtil.userIdOf(claims)).isEmpty();
    }

    // ── belongsToActiveSession ────────────────────────────────────────────────

    @Test
    void belongsToActiveSessionReturnsTrueWhenSessionMatchesAndTokenIsFresh() {
        when(tokenUtility.getActivityTime()).thenReturn(ACTIVITY_TIME_MS);
        User user = aUser(5, "alice@example.com", activeSession("session-5", 5, new Date()));
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-5", 5, inOneMinute());

        assertThat(jwtTokenUtil.belongsToActiveSession(claims, user)).isTrue();
    }

    @Test
    void belongsToActiveSessionReturnsFalseWhenUserHasNoSession() {
        User user = aUser(5, "alice@example.com", null);
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-5", 5, inOneMinute());

        assertThat(jwtTokenUtil.belongsToActiveSession(claims, user)).isFalse();
    }

    @Test
    void belongsToActiveSessionReturnsFalseWhenSessionIsInactive() {
        Session session = activeSession("session-5", 5, new Date());
        session.setActive(false);
        User user = aUser(5, "alice@example.com", session);
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-5", 5, inOneMinute());

        assertThat(jwtTokenUtil.belongsToActiveSession(claims, user)).isFalse();
    }

    @Test
    void belongsToActiveSessionReturnsFalseWhenSessionIdleLongerThanActivityTime() {
        when(tokenUtility.getActivityTime()).thenReturn(ACTIVITY_TIME_MS);
        Date tooLongAgo = new Date(System.currentTimeMillis() - ACTIVITY_TIME_MS - 1);
        User user = aUser(5, "alice@example.com", activeSession("session-5", 5, tooLongAgo));
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-5", 5, inOneMinute());

        assertThat(jwtTokenUtil.belongsToActiveSession(claims, user)).isFalse();
    }

    @Test
    void belongsToActiveSessionReturnsFalseWhenTokenIsExpired() {
        when(tokenUtility.getActivityTime()).thenReturn(ACTIVITY_TIME_MS);
        User user = aUser(5, "alice@example.com", activeSession("session-5", 5, new Date()));
        Date oneMinuteAgo = new Date(System.currentTimeMillis() - ONE_MINUTE_MS);
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-5", 5, oneMinuteAgo);

        assertThat(jwtTokenUtil.belongsToActiveSession(claims, user)).isFalse();
    }

    @Test
    void belongsToActiveSessionReturnsFalseWhenExpirationClaimIsMissing() {
        when(tokenUtility.getActivityTime()).thenReturn(ACTIVITY_TIME_MS);
        User user = aUser(5, "alice@example.com", activeSession("session-5", 5, new Date()));
        JWTClaimsSet claims = new JWTClaimsSet.Builder().jwtID("session-5").claim("userId", 5).build();

        assertThat(jwtTokenUtil.belongsToActiveSession(claims, user)).isFalse();
    }

    @Test
    void belongsToActiveSessionReturnsFalseWhenSessionIdDiffersFromTokenId() {
        when(tokenUtility.getActivityTime()).thenReturn(ACTIVITY_TIME_MS);
        User user = aUser(5, "alice@example.com", activeSession("session-new", 5, new Date()));
        JWTClaimsSet claims = claimsFor("alice@example.com", "session-old", 5, inOneMinute());

        assertThat(jwtTokenUtil.belongsToActiveSession(claims, user)).isFalse();
    }

    // ── getAllClaimsFromToken ─────────────────────────────────────────────────

    @Test
    @DisplayName("getAllClaimsFromToken — parses without verifying; webhook flow only, never authentication")
    void getAllClaimsFromTokenReturnsClaimsWhenSignatureIsNotVerified() throws Exception {
        String token = signWith(OTHER_SECRET, claimsFor("alice@example.com", "session-7", 7));

        JWTClaimsSet claims = jwtTokenUtil.getAllClaimsFromToken(token);

        assertThat(claims.getSubject()).isEqualTo("alice@example.com");
    }

    @Test
    void getAllClaimsFromTokenThrowsRuntimeExceptionWhenTokenIsMalformed() {
        assertThatThrownBy(() -> jwtTokenUtil.getAllClaimsFromToken("not-a-jwt"))
                .isInstanceOf(RuntimeException.class)
                .hasCauseInstanceOf(ParseException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static JWTClaimsSet claimsFor(String subject, String sessionId, int userId) {
        return claimsFor(subject, sessionId, userId, inOneMinute());
    }

    private static JWTClaimsSet claimsFor(String subject, String sessionId, int userId, Date expiration) {
        return new JWTClaimsSet.Builder()
                .subject(subject)
                .jwtID(sessionId)
                .claim("userId", userId)
                .expirationTime(expiration)
                .build();
    }

    private static Date inOneMinute() {
        return new Date(System.currentTimeMillis() + ONE_MINUTE_MS);
    }

    private static Session activeSession(String id, int userId, Date lastAccessed) {
        Session session = SessionFixture.aSessionWithId(id, userId);
        session.setLastAccessed(lastAccessed);
        return session;
    }

    private static User aUser(int id, String email, Session session) {
        User user = UserFixture.anEmptyUser();
        user.setId(id);
        user.setEmail(email);
        user.setUserRole(UserRoleFixture.aStandardUserRole());
        user.setSession(session);
        return user;
    }

    private static String signWith(String secret, JWTClaimsSet claims) throws Exception {
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(secret));
        return jwt.serialize();
    }
}

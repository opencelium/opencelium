/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.props.PasswordResetProperties;
import com.becon.opencelium.backend.database.mysql.entity.PasswordResetToken;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.PasswordResetTokenRepository;
import com.becon.opencelium.backend.database.mysql.service.PasswordResetRateLimiter;
import com.becon.opencelium.backend.database.mysql.service.PasswordResetServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.SessionService;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.ServiceUnavailableException;
import com.becon.opencelium.backend.exception.TooManyRequestsException;
import com.becon.opencelium.backend.exception.UserNotFoundException;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import com.becon.opencelium.backend.testutil.fixture.PasswordResetTokenFixture;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import org.apache.commons.codec.digest.DigestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link PasswordResetServiceImpl}.
 *
 * Properties are pinned in {@link #setUp()} so {@code Instant.now()}-based
 * checks ({@code isExpired}, the lockout-window computation) are made
 * deterministic by controlling the token's {@code createdAt} timestamp.
 * The end-to-end invariant — token stored as SHA-256, raw token mailed to
 * the user — is pinned by hashing the captured email body and comparing it
 * against the captured persisted token.
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

    private static final String BASE_URL = "https://oc.test/reset";
    private static final long TOKEN_ACTIVITY_MS = 60_000L;
    private static final int MAX_ATTEMPTS = 2;
    private static final long LOCKOUT_MS = 60_000L;

    @Mock
    private UserService userService;

    @Mock
    private SessionService sessionService;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordResetRateLimiter rateLimiter;

    @Mock
    private EmailServiceImpl emailService;

    private PasswordResetServiceImpl service;

    @BeforeEach
    void setUp() {
        PasswordResetProperties props = new PasswordResetProperties();
        props.setBaseUrl(BASE_URL);
        props.setTokenActivityTime(TOKEN_ACTIVITY_MS);
        props.setMaxEmailValidationAttempts(MAX_ATTEMPTS);
        props.setLockoutTime(LOCKOUT_MS);

        service = new PasswordResetServiceImpl(
                userService, sessionService, tokenRepository, rateLimiter, props, emailService);
    }

    // ── requestReset ──────────────────────────────────────────────────────────

    @Test
    void requestResetThrowsTooManyRequestsWhenIpRateLimited() {
        doThrowTooMany().when(rateLimiter).enforceLimit("IP:9.9.9.9");

        assertThatThrownBy(() -> service.requestReset("a@b.com", "9.9.9.9"))
                .isInstanceOf(TooManyRequestsException.class);

        // No work past the rate-limit guard.
        verifyNoInteractions(userService, tokenRepository, emailService, sessionService);
    }

    @Test
    void requestResetThrowsTooManyRequestsWhenEmailRateLimited() {
        // lenient(): the IP call lands first against an unstubbed arg, which would
        // trip STRICT_STUBS on the EMAIL stub; we only care about the second call.
        org.mockito.Mockito.lenient()
                .doThrow(new TooManyRequestsException("too many"))
                .when(rateLimiter).enforceLimit("EMAIL:a@b.com");

        assertThatThrownBy(() -> service.requestReset("A@B.com", "1.1.1.1"))
                .isInstanceOf(TooManyRequestsException.class);

        // The email key is lower-cased before being passed to the limiter.
        verify(rateLimiter).enforceLimit("IP:1.1.1.1");
        verify(rateLimiter).enforceLimit("EMAIL:a@b.com");
        verifyNoInteractions(userService, tokenRepository, emailService, sessionService);
    }

    @Test
    void requestResetThrowsBadRequestWhenEmailNotFound() {
        when(userService.findByEmail("missing@b.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requestReset("missing@b.com", "1.1.1.1"))
                .isInstanceOfSatisfying(GeneralServiceException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getError()).isEqualTo(ExceptionConstant.EMAIL_NOT_EXISTS);
                });

        verify(userService, never()).findById(anyInt());
        verifyNoInteractions(tokenRepository, emailService, sessionService);
    }

    @Test
    void requestResetThrowsServiceUnavailableWhenUserIsLdap() {
        User user = userWith(7, "a@b.com", AuthMethod.LDAP);
        when(userService.findByEmail("a@b.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.requestReset("a@b.com", "1.1.1.1"))
                .isInstanceOfSatisfying(ServiceUnavailableException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(ex.getError()).isEqualTo(ExceptionConstant.EMAIL_RECOVERY_FAILED);
                });

        // LDAP users are filtered out before the locked-row lookup runs.
        verify(userService, never()).findById(anyInt());
        verifyNoInteractions(tokenRepository, emailService, sessionService);
    }

    @Test
    void requestResetThrowsUserNotFoundWhenLockedLookupFails() {
        // Race-defence path: row exists at findByEmail, gone at findById.
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        when(userService.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(userService.findById(7)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requestReset("a@b.com", "1.1.1.1"))
                .isInstanceOf(UserNotFoundException.class);

        verifyNoInteractions(tokenRepository, emailService, sessionService);
    }

    @Test
    void requestResetThrowsTooManyRequestsWhenActiveUnexpiredTokenExists() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        when(userService.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(userService.findById(7)).thenReturn(Optional.of(user));

        // Fresh token (createdAt = now) — well inside the activity window.
        PasswordResetToken active = PasswordResetTokenFixture.aFreshTokenFor(user, "stored-hash");
        when(tokenRepository.findByUserIdAndValidTrue(7)).thenReturn(Optional.of(active));

        assertThatThrownBy(() -> service.requestReset("a@b.com", "1.1.1.1"))
                .isInstanceOf(TooManyRequestsException.class);

        // No save of any kind, no email sent.
        verify(tokenRepository, never()).save(any());
        verifyNoInteractions(emailService);
    }

    @Test
    void requestResetInvalidatesExpiredTokenAndIssuesNewOneWhenWithinLatestLimit() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        when(userService.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(userService.findById(7)).thenReturn(Optional.of(user));

        // Existing token is older than the activity window — must be expired.
        PasswordResetToken expired = PasswordResetTokenFixture.aTokenCreatedMillisAgo(
                user, "stored-hash", TOKEN_ACTIVITY_MS * 2);
        when(tokenRepository.findByUserIdAndValidTrue(7)).thenReturn(Optional.of(expired));

        // Only one token in the latest-N — below the cap, so the lockout branch is skipped.
        when(tokenRepository.findLatestTokensByUserId(7, MAX_ATTEMPTS))
                .thenReturn(List.of(expired));
        when(emailService.sendMessage(eq("a@b.com"), eq("Reset Password"), anyString()))
                .thenReturn(true);

        service.requestReset("a@b.com", "1.1.1.1");

        // The expired token is marked invalid before the new one is issued.
        assertThat(expired.isValid()).isFalse();

        // Two saves total: one to invalidate the expired token, one to persist the new token.
        verify(tokenRepository, times(2)).save(any(PasswordResetToken.class));
    }

    @Test
    void requestResetThrowsTooManyRequestsWhenOldestOfNTokensStillInsideLockoutWindow() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        when(userService.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(userService.findById(7)).thenReturn(Optional.of(user));

        PasswordResetToken expired = PasswordResetTokenFixture.aTokenCreatedMillisAgo(
                user, "stored-hash", TOKEN_ACTIVITY_MS * 2);
        when(tokenRepository.findByUserIdAndValidTrue(7)).thenReturn(Optional.of(expired));

        // size == max AND oldest.createdAt = now → lockoutEnds is far in the future.
        PasswordResetToken oldestInWindow = PasswordResetTokenFixture.aFreshTokenFor(user, "old-hash");
        when(tokenRepository.findLatestTokensByUserId(7, MAX_ATTEMPTS))
                .thenReturn(List.of(oldestInWindow, oldestInWindow));

        assertThatThrownBy(() -> service.requestReset("a@b.com", "1.1.1.1"))
                .isInstanceOf(TooManyRequestsException.class);

        // Exactly one save — the expired-token invalidation. No new token issued, no email sent.
        verify(tokenRepository, times(1)).save(any(PasswordResetToken.class));
        verifyNoInteractions(emailService);
    }

    @Test
    void requestResetIssuesNewTokenWhenOldestOfNTokensOutsideLockoutWindow() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        when(userService.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(userService.findById(7)).thenReturn(Optional.of(user));

        PasswordResetToken expired = PasswordResetTokenFixture.aTokenCreatedMillisAgo(
                user, "stored-hash", TOKEN_ACTIVITY_MS * 2);
        when(tokenRepository.findByUserIdAndValidTrue(7)).thenReturn(Optional.of(expired));

        // size == max but oldest.createdAt is comfortably past lockoutEnds:
        //   lockoutEnds = oldest + TOKEN_ACTIVITY_MS * MAX_ATTEMPTS + LOCKOUT_MS
        // → push createdAt far enough back to put that sum in the past.
        long longAgo = (TOKEN_ACTIVITY_MS * MAX_ATTEMPTS) + LOCKOUT_MS + 60_000L;
        PasswordResetToken oldestOutOfWindow =
                PasswordResetTokenFixture.aTokenCreatedMillisAgo(user, "old-hash", longAgo);
        when(tokenRepository.findLatestTokensByUserId(7, MAX_ATTEMPTS))
                .thenReturn(List.of(oldestOutOfWindow, oldestOutOfWindow));
        when(emailService.sendMessage(eq("a@b.com"), eq("Reset Password"), anyString()))
                .thenReturn(true);

        service.requestReset("a@b.com", "1.1.1.1");

        // Lockout-past path → invalidate + issue: exactly two saves, one email.
        verify(tokenRepository, times(2)).save(any(PasswordResetToken.class));
        verify(emailService).sendMessage(eq("a@b.com"), eq("Reset Password"), anyString());
    }

    @Test
    void requestResetSavesHashedTokenAndSendsEmailWithRawTokenWhenSuccessful() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        when(userService.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(userService.findById(7)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserIdAndValidTrue(7)).thenReturn(Optional.empty());
        when(emailService.sendMessage(eq("a@b.com"), eq("Reset Password"), anyString()))
                .thenReturn(true);

        service.requestReset("a@b.com", "1.1.1.1");

        // Capture both the persisted token and the outbound email body.
        ArgumentCaptor<PasswordResetToken> savedToken = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(savedToken.capture());

        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendMessage(eq("a@b.com"), eq("Reset Password"), body.capture());

        // The body carries the raw token under ?token=, and the DB holds its SHA-256.
        // This pins the invariant: an attacker reading the DB can't reconstruct the raw token.
        assertThat(body.getValue()).startsWith(BASE_URL + "?token=");
        String rawToken = body.getValue().substring((BASE_URL + "?token=").length());
        assertThat(rawToken).isNotBlank();
        assertThat(savedToken.getValue().getToken())
                .isEqualTo(DigestUtils.sha256Hex(rawToken));
        assertThat(savedToken.getValue().getUser()).isSameAs(user);
    }

    @Test
    void requestResetThrowsServiceUnavailableWhenEmailSendFails() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        when(userService.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(userService.findById(7)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserIdAndValidTrue(7)).thenReturn(Optional.empty());
        when(emailService.sendMessage(eq("a@b.com"), eq("Reset Password"), anyString()))
                .thenReturn(false);

        assertThatThrownBy(() -> service.requestReset("a@b.com", "1.1.1.1"))
                .isInstanceOfSatisfying(ServiceUnavailableException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(ex.getError()).isEqualTo(ExceptionConstant.EMAIL_RECOVERY_FAILED);
                });

        // Token was already persisted before the send attempt — this documents
        // the current "save-then-send" ordering. If the order is ever swapped,
        // this assertion will flag it for review.
        verify(tokenRepository).save(any(PasswordResetToken.class));
    }

    // ── resetPassword ─────────────────────────────────────────────────────────

    @Test
    void resetPasswordThrowsBadRequestWhenTokenNotFound() {
        when(tokenRepository.findByTokenAndValidTrue(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resetPassword("rawToken", "newPw"))
                .isInstanceOfSatisfying(GeneralServiceException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getError()).isEqualTo(ExceptionConstant.INVALID_TOKEN);
                });

        verifyNoInteractions(userService, sessionService);
    }

    @Test
    void resetPasswordThrowsBadRequestWhenTokenExpired() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        PasswordResetToken expired = PasswordResetTokenFixture.aTokenCreatedMillisAgo(
                user, "stored-hash", TOKEN_ACTIVITY_MS * 2);
        when(tokenRepository.findByTokenAndValidTrue(anyString())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.resetPassword("rawToken", "newPw"))
                .isInstanceOfSatisfying(GeneralServiceException.class, ex -> {
                    assertThat(ex.getError()).isEqualTo(ExceptionConstant.INVALID_TOKEN);
                });

        verifyNoInteractions(userService, sessionService);
    }

    @Test
    void resetPasswordEncodesPasswordAndMarksTokenUsedWhenValid() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        PasswordResetToken token = PasswordResetTokenFixture.aFreshTokenFor(user, "stored-hash");
        when(tokenRepository.findByTokenAndValidTrue(anyString())).thenReturn(Optional.of(token));
        when(userService.getById(7)).thenReturn(user);
        when(userService.encodePassword("newPw")).thenReturn("$2a$encoded");

        service.resetPassword("rawToken", "newPw");

        // User mutated in place — relies on @Transactional dirty-checking, not save().
        assertThat(user.getPassword()).isEqualTo("$2a$encoded");
        // Token consumed: both flags flipped so the same row can't be reused.
        assertThat(token.isUsed()).isTrue();
        assertThat(token.isValid()).isFalse();
    }

    @Test
    void resetPasswordDeletesUserSessionWhenSuccessful() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        PasswordResetToken token = PasswordResetTokenFixture.aFreshTokenFor(user, "stored-hash");
        when(tokenRepository.findByTokenAndValidTrue(anyString())).thenReturn(Optional.of(token));
        when(userService.getById(7)).thenReturn(user);
        when(userService.encodePassword(anyString())).thenReturn("$2a$encoded");

        service.resetPassword("rawToken", "newPw");

        // Existing session is always cleared on successful reset, so a stale
        // login can't survive a password change.
        verify(sessionService).deleteByUserId(7);
    }

    @Test
    void resetPasswordLooksUpByHashedTokenNotRawWhenInvoked() {
        User user = userWith(7, "a@b.com", AuthMethod.BASIC);
        String raw = "raw-token-value";
        String hashed = DigestUtils.sha256Hex(raw);
        PasswordResetToken token = PasswordResetTokenFixture.aFreshTokenFor(user, hashed);
        when(tokenRepository.findByTokenAndValidTrue(hashed)).thenReturn(Optional.of(token));
        when(userService.getById(7)).thenReturn(user);
        when(userService.encodePassword(anyString())).thenReturn("$2a$encoded");

        service.resetPassword(raw, "newPw");

        // The raw token is never used as a lookup key — only its hash.
        verify(tokenRepository).findByTokenAndValidTrue(hashed);
        verify(tokenRepository, never()).findByTokenAndValidTrue(raw);
    }

    // ── isExpired ─────────────────────────────────────────────────────────────

    @Test
    void isExpiredReturnsTrueWhenCreatedAtPlusActivityIsBeforeNow() {
        PasswordResetToken token = new PasswordResetToken();
        token.setCreatedAt(new Date(System.currentTimeMillis() - TOKEN_ACTIVITY_MS * 2));

        assertThat(service.isExpired(token)).isTrue();
    }

    @Test
    void isExpiredReturnsFalseWhenWithinActivityWindow() {
        PasswordResetToken token = new PasswordResetToken();
        token.setCreatedAt(new Date());

        assertThat(service.isExpired(token)).isFalse();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static User userWith(int id, String email, AuthMethod authMethod) {
        User user = UserFixture.anEmptyUser();
        user.setId(id);
        user.setEmail(email);
        user.setAuthMethod(authMethod);
        return user;
    }

    private static org.mockito.stubbing.Stubber doThrowTooMany() {
        return org.mockito.Mockito.doThrow(new TooManyRequestsException("too many"));
    }
}

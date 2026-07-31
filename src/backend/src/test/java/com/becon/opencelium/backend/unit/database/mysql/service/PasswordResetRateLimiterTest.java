/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.constant.props.PasswordResetProperties;
import com.becon.opencelium.backend.database.mysql.service.PasswordResetRateLimiter;
import com.becon.opencelium.backend.exception.TooManyRequestsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Unit tests for {@link PasswordResetRateLimiter}.
 *
 * The limiter uses {@link java.time.Instant#now()} directly, so tests configure
 * a tight {@code lockoutTime} window (300 ms) and a small attempt cap (3) and
 * either stay inside the window or sleep just past it. The thread-safety case
 * fires N parallel calls on the same key and pins the exact split between
 * accepted attempts and {@link TooManyRequestsException}s.
 */
class PasswordResetRateLimiterTest {

    private static final int MAX_ATTEMPTS = 3;
    private static final long LOCKOUT_MS = 300L;

    private PasswordResetRateLimiter limiter;

    @BeforeEach
    void setUp() {
        PasswordResetProperties props = new PasswordResetProperties();
        props.setMaxEmailValidationAttempts(MAX_ATTEMPTS);
        props.setLockoutTime(LOCKOUT_MS);
        limiter = new PasswordResetRateLimiter(props);
    }

    // ── enforceLimit ──────────────────────────────────────────────────────────

    @Test
    void enforceLimitAllowsFirstAttemptWhenKeyUnknown() {
        assertThatCode(() -> limiter.enforceLimit("IP:1.2.3.4"))
                .doesNotThrowAnyException();
    }

    @Test
    void enforceLimitAllowsAttemptsUpToMaxWhenWithinWindow() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            int attempt = i + 1;
            assertThatCode(() -> limiter.enforceLimit("EMAIL:a@b.com"))
                    .as("attempt %d should be allowed", attempt)
                    .doesNotThrowAnyException();
        }
    }

    @Test
    void enforceLimitThrowsTooManyRequestsWhenLimitExceeded() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.enforceLimit("EMAIL:a@b.com");
        }

        assertThatThrownBy(() -> limiter.enforceLimit("EMAIL:a@b.com"))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessage("Too many attempts, try later");
    }

    @Test
    void enforceLimitAllowsNewAttemptWhenOldestExpiredOutOfWindow() throws InterruptedException {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.enforceLimit("EMAIL:a@b.com");
        }
        // Sleep just past the lockout window so all earlier attempts age out.
        Thread.sleep(LOCKOUT_MS + 50);

        assertThatCode(() -> limiter.enforceLimit("EMAIL:a@b.com"))
                .doesNotThrowAnyException();
    }

    @Test
    void enforceLimitTracksKeysIndependentlyWhenDifferentKeysUsed() {
        // Saturate one key.
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.enforceLimit("IP:1.1.1.1");
        }
        assertThatThrownBy(() -> limiter.enforceLimit("IP:1.1.1.1"))
                .isInstanceOf(TooManyRequestsException.class);

        // A different key is untouched.
        assertThatCode(() -> limiter.enforceLimit("EMAIL:b@c.com"))
                .doesNotThrowAnyException();
    }

    @Test
    void enforceLimitIsThreadSafeWhenConcurrentCallsOnSameKey() throws InterruptedException {
        int threads = 20;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        AtomicInteger accepted = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();

        try {
            for (int i = 0; i < threads; i++) {
                pool.submit(() -> {
                    try {
                        limiter.enforceLimit("EMAIL:race@b.com");
                        accepted.incrementAndGet();
                    } catch (TooManyRequestsException e) {
                        rejected.incrementAndGet();
                    }
                });
            }
        } finally {
            pool.shutdown();
            assertThat(pool.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }

        // Exactly MAX_ATTEMPTS calls must be admitted, the rest rejected —
        // no double-counting, no over-admission under contention.
        assertThat(accepted.get()).isEqualTo(MAX_ATTEMPTS);
        assertThat(rejected.get()).isEqualTo(threads - MAX_ATTEMPTS);
    }
}

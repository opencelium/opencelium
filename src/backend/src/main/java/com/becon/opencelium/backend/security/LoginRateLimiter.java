/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limits failed password logins, separately per account identifier and per client address,
 * within a sliding window.
 *
 * <p>Only failures count: a login is refused once an identifier or a client has reached its
 * maximum number of failed attempts within the window, and is allowed again as soon as the oldest
 * of those failures leaves the window. A successful login clears the failures of its identifier
 * but not of its client, so one valid account cannot be used to reset the budget of a client that
 * is guessing other accounts. Identifiers are compared case-insensitively, like the database
 * does, so varying the case does not open a fresh budget.
 *
 * <p>State is kept in memory and per instance: it does not survive a restart and is not shared
 * between nodes.
 *
 * <p>Settings, all optional: {@code opencelium.login.max-failures-per-account} (default 5),
 * {@code opencelium.login.max-failures-per-client} (default 20) and
 * {@code opencelium.login.failure-window} in milliseconds (default 15 minutes).
 */
@Component
public class LoginRateLimiter {

    private static final String ACCOUNT_KEY_PREFIX = "account:";
    private static final String CLIENT_KEY_PREFIX = "client:";

    private final int maxFailuresPerAccount;
    private final int maxFailuresPerClient;
    private final Duration window;
    private final Clock clock;
    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    @Autowired
    public LoginRateLimiter(
            @Value("${opencelium.login.max-failures-per-account:5}") int maxFailuresPerAccount,
            @Value("${opencelium.login.max-failures-per-client:20}") int maxFailuresPerClient,
            @Value("${opencelium.login.failure-window:900000}") long windowMillis) {
        this(maxFailuresPerAccount, maxFailuresPerClient, Duration.ofMillis(windowMillis), Clock.systemUTC());
    }

    /** For tests, which need to move time forward. */
    public LoginRateLimiter(int maxFailuresPerAccount, int maxFailuresPerClient, Duration window, Clock clock) {
        if (maxFailuresPerAccount < 1 || maxFailuresPerClient < 1) {
            throw new IllegalArgumentException("Login failure limits must be at least 1");
        }
        if (window.isNegative() || window.isZero()) {
            throw new IllegalArgumentException("Login failure window must be positive");
        }
        this.maxFailuresPerAccount = maxFailuresPerAccount;
        this.maxFailuresPerClient = maxFailuresPerClient;
        this.window = window;
        this.clock = clock;
    }

    /**
     * Refuses the attempt when the client or the identifier has used up its failures.
     *
     * @param clientAddress the remote address of the request; {@code null} skips the client check
     * @param identifier the login identifier; {@code null} or blank skips the account check
     * @throws TooManyLoginAttemptsException carrying how long until the next attempt is allowed
     */
    public void checkAllowed(String clientAddress, String identifier) {
        Instant now = clock.instant();

        Duration retryAfter = max(
                blockedFor(clientKey(clientAddress), maxFailuresPerClient, now),
                blockedFor(accountKey(identifier), maxFailuresPerAccount, now));

        if (!retryAfter.isZero()) {
            throw new TooManyLoginAttemptsException(retryAfter);
        }
    }

    /** Counts a failed attempt against the client and the identifier. */
    public void recordFailure(String clientAddress, String identifier) {
        Instant now = clock.instant();
        record(clientKey(clientAddress), now);
        record(accountKey(identifier), now);
    }

    /** Forgets the failures of an identifier after it has authenticated. */
    public void recordSuccess(String identifier) {
        String key = accountKey(identifier);
        if (key != null) {
            failures.remove(key);
        }
    }

    private Duration blockedFor(String key, int maxFailures, Instant now) {
        if (key == null) {
            return Duration.ZERO;
        }

        Duration[] retryAfter = {Duration.ZERO};
        failures.computeIfPresent(key, (k, timestamps) -> {
            dropExpired(timestamps, now);
            if (timestamps.size() >= maxFailures) {
                // the oldest failure that still keeps the count at the limit
                Instant unblocking = timestamps.stream()
                        .skip(timestamps.size() - maxFailures)
                        .findFirst()
                        .orElseThrow()
                        .plus(window);
                retryAfter[0] = Duration.between(now, unblocking);
            }
            return timestamps.isEmpty() ? null : timestamps;
        });
        return retryAfter[0];
    }

    private void record(String key, Instant now) {
        if (key == null) {
            return;
        }
        failures.compute(key, (k, timestamps) -> {
            Deque<Instant> result = timestamps == null ? new ArrayDeque<>() : timestamps;
            dropExpired(result, now);
            result.addLast(now);
            return result;
        });
    }

    private void dropExpired(Deque<Instant> timestamps, Instant now) {
        Instant oldestAllowed = now.minus(window);
        while (!timestamps.isEmpty() && !timestamps.peekFirst().isAfter(oldestAllowed)) {
            timestamps.pollFirst();
        }
    }

    private static Duration max(Duration first, Duration second) {
        return first.compareTo(second) >= 0 ? first : second;
    }

    private static String clientKey(String clientAddress) {
        return clientAddress == null || clientAddress.isBlank() ? null : CLIENT_KEY_PREFIX + clientAddress;
    }

    private static String accountKey(String identifier) {
        return Optional.ofNullable(identifier)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(value -> ACCOUNT_KEY_PREFIX + value.toLowerCase(Locale.ROOT))
                .orElse(null);
    }

    /**
     * Thrown when a login is refused before the password is checked because too many attempts
     * have failed. An {@link AuthenticationException}, so the login filter answers it like any
     * other failed login, with status 429 instead of 403.
     */
    public static final class TooManyLoginAttemptsException extends AuthenticationException {

        private final transient Duration retryAfter;

        public TooManyLoginAttemptsException(Duration retryAfter) {
            super("Too many failed login attempts, try again later");
            this.retryAfter = retryAfter;
        }

        /** How long until the next attempt is allowed, rounded up to whole seconds. */
        public long getRetryAfterSeconds() {
            long seconds = retryAfter.getSeconds();
            return retryAfter.getNano() > 0 ? seconds + 1 : Math.max(seconds, 1);
        }
    }
}

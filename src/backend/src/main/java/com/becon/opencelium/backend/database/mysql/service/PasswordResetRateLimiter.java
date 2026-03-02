package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.props.PasswordResetProperties;
import com.becon.opencelium.backend.exception.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PasswordResetRateLimiter {
    private final int maxEmailValidationAttempts;
    private final long lockoutTime;

    public PasswordResetRateLimiter(PasswordResetProperties props) {
        this.maxEmailValidationAttempts = props.getMaxEmailValidationAttempts();
        this.lockoutTime = props.getLockoutTime();
    }

    private final Map<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    public void enforceLimit(String key) {
        Instant now = Instant.now();
        Duration window = Duration.ofMillis(lockoutTime);

        Deque<Instant> deque = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst().isBefore(now.minus(window))) {
                // remove expired attempts
                deque.pollFirst();
            }

            if (deque.size() >= maxEmailValidationAttempts) {
                throw new TooManyRequestsException("Too many attempts, try later");
            }

            deque.addLast(now);
        }
    }
}

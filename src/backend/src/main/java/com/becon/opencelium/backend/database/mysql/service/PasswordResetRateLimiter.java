package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PasswordResetRateLimiter {
    @Value("${spring.security.max-email-validation-attempts}")
    private int maxEmailValidationAttempts;
    @Value("${spring.security.lockout-time}")
    private long lockoutTime;

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
                throw new GeneralServiceException(HttpStatus.TOO_MANY_REQUESTS, ExceptionConstant.TOO_MANY_ATTEMPTS, "Too many attempts, try later");
            }

            deque.addLast(now);
        }
    }
}

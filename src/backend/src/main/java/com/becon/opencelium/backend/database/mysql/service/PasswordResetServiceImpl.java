package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mysql.entity.PasswordResetToken;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.PasswordResetTokenRepository;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {
    private final UserService userService;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetRateLimiter rateLimiter;
    private final EmailServiceImpl emailService;

    @Value("${spring.security.base-url}")
    private String baseUrl;
    @Value("${spring.security.token-activity-time}")
    private long tokenActivityTime;
    @Value("${spring.security.max-email-validation-attempts}")
    private int maxEmailValidationAttempts;
    @Value("${spring.security.lockout-time}")
    private long lockoutTime;

    public PasswordResetServiceImpl(
            UserService userService,
            PasswordResetTokenRepository tokenRepository,
            PasswordResetRateLimiter rateLimiter,
            EmailServiceImpl emailService
    ) {
        this.userService = userService;
        this.tokenRepository = tokenRepository;
        this.rateLimiter = rateLimiter;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public void requestReset(String email, String clientIp) {
        // check rate limits
        rateLimiter.enforceLimit("IP:" + clientIp);
        rateLimiter.enforceLimit("EMAIL:" + email.toLowerCase());

        // check if we have user by email
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.EMAIL_NOT_EXISTS, "email does not exists"));

        // check if user has unused & valid token:
        Optional<PasswordResetToken> optionalToken = tokenRepository.findByUserIdAndValidTrue(user.getId());
        if (optionalToken.isPresent()) {
            var token = optionalToken.get();

            if (!isExpired(token)) {
                // user has token: valid AND not used AND not expired
                throw new GeneralServiceException(HttpStatus.TOO_MANY_REQUESTS, ExceptionConstant.TOO_MANY_ATTEMPTS, "too many attempts, try later");
            } else {
                // user has token: valid AND not used BUT expired
                // 1) invalidate found token
                token.setValid(false);
                tokenRepository.save(token);

                // 2) check if limit is reached
                var tokens = tokenRepository.findLatestTokensByUserId(user.getId(), maxEmailValidationAttempts);
                if (tokens.size() == maxEmailValidationAttempts) {
                    var oldest = tokens.get(maxEmailValidationAttempts - 1);

                    Instant lockoutEnds = oldest.getCreatedAt()
                            .toInstant()
                            .plusMillis(tokenActivityTime * maxEmailValidationAttempts + lockoutTime);

                    if (Instant.now().isBefore(lockoutEnds)) {
                        throw new GeneralServiceException(HttpStatus.TOO_MANY_REQUESTS, ExceptionConstant.TOO_MANY_ATTEMPTS, "too many attempts, try later");
                    }
                }
            }
        }

        // at this point used does not have token: valid AND not used AND not expired
        String rawToken = generateToken();
        String hashedToken = hashToken(rawToken);

        PasswordResetToken token = new PasswordResetToken();
        token.setUserId(user.getId());
        token.setToken(hashedToken);

        tokenRepository.save(token);

        String message = "%s?token=%s".formatted(baseUrl, rawToken);
        emailService.sendMessage(user.getEmail(), "Reset Password", message);
    }

    @Override
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String hashedToken = hashToken(rawToken);

        PasswordResetToken token = tokenRepository
                .findByTokenAndValidTrue(hashedToken)
                .orElseThrow(() -> new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.INVALID_TOKEN, "invalid or expired token"));

        if (isExpired(token)) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.INVALID_TOKEN, "invalid or expired token");
        }

        User user = userService.getById(token.getUserId());
        user.setPassword(userService.encodePassword(newPassword));

        token.setUsed(true);
        token.setValid(false);
    }

    public boolean isExpired(PasswordResetToken token) {
        Instant expiresAt = token.getCreatedAt().toInstant().plusMillis(tokenActivityTime);
        return Instant.now().isAfter(expiresAt);
    }

    private String generateToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        return DigestUtils.sha256Hex(token);
    }
}

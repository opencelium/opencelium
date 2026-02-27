package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.props.PasswordResetProperties;
import com.becon.opencelium.backend.database.mysql.entity.PasswordResetToken;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.PasswordResetTokenRepository;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.ServiceUnavailableException;
import com.becon.opencelium.backend.exception.TooManyRequestsException;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import org.apache.commons.codec.digest.DigestUtils;
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
    private final SessionService sessionService;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetRateLimiter rateLimiter;
    private final EmailServiceImpl emailService;

    private final String baseUrl;
    private final long tokenActivityTime;
    private final int maxEmailValidationAttempts;
    private final long lockoutTime;

    public PasswordResetServiceImpl(
            UserService userService,
            SessionService sessionService,
            PasswordResetTokenRepository tokenRepository,
            PasswordResetRateLimiter rateLimiter,
            PasswordResetProperties props,
            EmailServiceImpl emailService
    ) {
        this.userService = userService;
        this.sessionService = sessionService;
        this.tokenRepository = tokenRepository;
        this.rateLimiter = rateLimiter;
        this.emailService = emailService;

        this.baseUrl = props.getBaseUrl();
        this.tokenActivityTime = props.getTokenActivityTime();
        this.maxEmailValidationAttempts = props.getMaxEmailValidationAttempts();
        this.lockoutTime = props.getLockoutTime();
    }

    @Override
    @Transactional
    public void requestReset(String email, String clientIp) {
        rateLimiter.enforceLimit("IP:" + clientIp);
        rateLimiter.enforceLimit("EMAIL:" + email.toLowerCase());

        User user = userService.findByEmail(email)
                .orElseThrow(() -> new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.EMAIL_NOT_EXISTS, "email does not exists"));

        if (user.getAuthMethod() == AuthMethod.LDAP) {
            throw new ServiceUnavailableException(ExceptionConstant.EMAIL_RECOVERY_FAILED, "There is an issue with your email configuration. For security reasons, the detailed error message has been written to your Opencelium logs. Please review the logs for more information.");
        }

        Optional<PasswordResetToken> optionalToken = tokenRepository.findByUserIdAndValidTrue(user.getId());
        if (optionalToken.isPresent()) {
            // check if user has unused & valid token:
            var token = optionalToken.get();

            if (!isExpired(token)) {
                // user has token: valid AND not used AND not expired
                throw new TooManyRequestsException("too many attempts, try later");
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
                        throw new TooManyRequestsException("too many attempts, try later");
                    }
                }
            }
        }

        // at this point used does not have token: valid AND not used AND not expired
        String rawToken = generateToken();
        String hashedToken = hashToken(rawToken);

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(hashedToken);

        tokenRepository.save(token);

        String message = "%s?token=%s".formatted(baseUrl, rawToken);
        boolean sent = emailService.sendMessage(user.getEmail(), "Reset Password", message);
        if (!sent) {
            throw new ServiceUnavailableException(ExceptionConstant.EMAIL_RECOVERY_FAILED, "There is an issue with your email configuration. For security reasons, the detailed error message has been written to your Opencelium logs. Please review the logs for more information.");
        }
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

        int userId = token.getUser().getId();
        User user = userService.getById(userId);
        user.setPassword(userService.encodePassword(newPassword));

        token.setUsed(true);
        token.setValid(false);

        // remove session if exists
        sessionService.deleteByUserId(userId);
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

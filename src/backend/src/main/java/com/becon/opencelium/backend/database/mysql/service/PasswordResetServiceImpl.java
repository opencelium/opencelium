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
import com.becon.opencelium.backend.exception.UserNotFoundException;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import com.becon.opencelium.backend.resource.user.PasswordLinkResource;
import org.apache.commons.codec.digest.DigestUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {
    private static final Logger logger = LoggerFactory.getLogger(PasswordResetServiceImpl.class);

    private final UserService userService;
    private final SessionService sessionService;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetRateLimiter rateLimiter;
    private final EmailServiceImpl emailService;

    private final String baseUrl;
    private final long tokenActivityTime;
    private final int maxEmailValidationAttempts;
    private final long lockoutTime;
    private final long adminLinkActivityTime;

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
        this.adminLinkActivityTime = props.getAdminLinkActivityTime();
    }

    @Override
    @Transactional
    public void requestReset(String email, String clientIp) {
        rateLimiter.enforceLimit("IP:" + clientIp);
        rateLimiter.enforceLimit("EMAIL:" + email.toLowerCase());

        // lookup for user (no lock)
        User userNotLocked = userService.findByEmail(email)
                .orElseThrow(() -> new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.EMAIL_NOT_EXISTS, "email does not exists"));

        if (userNotLocked.getAuthMethod() == AuthMethod.LDAP) {
            throw new ServiceUnavailableException(ExceptionConstant.EMAIL_RECOVERY_FAILED, "There is an issue with your email configuration. For security reasons, the detailed error message has been written to your Opencelium logs. Please review the logs for more information.");
        }

        // find user by id and lock
        int userId = userNotLocked.getId();
        User user = userService.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));

        // The valid token may also be an admin link: while it works, the user already has a link.
        Optional<PasswordResetToken> optionalToken = tokenRepository.findByUserIdAndValidTrue(userId);
        if (optionalToken.isPresent()) {
            // check if user has unused & valid token:
            var token = optionalToken.get();

            if (!isExpired(token)) {
                // user has token: valid AND not used AND not expired
                throw new TooManyRequestsException("too many attempts, try later");
            }

            // user has token: valid AND not used BUT expired
            // 1) invalidate found token
            token.setValid(false);
            tokenRepository.save(token);

            // 2) check if limit is reached
            var tokens = tokenRepository.findLatestSelfServiceTokensByUserId(userId, maxEmailValidationAttempts);
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

        // at this point used does not have token: valid AND not used AND not expired
        String rawToken = generateToken();
        String hashedToken = hashToken(rawToken);

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(hashedToken);
        token.setPurpose(PasswordResetToken.Purpose.SELF_SERVICE);
        token.setExpiresAt(Date.from(expiryFromNow(tokenActivityTime)));

        tokenRepository.save(token);

        String message = buildLink(rawToken);
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

        // The token is only used up if it is still valid now: of two requests racing with the
        // same token, the one that finds it already used fails here and changes nothing.
        if (tokenRepository.consumeValidToken(hashedToken) == 0) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.INVALID_TOKEN, "invalid or expired token");
        }

        int userId = token.getUser().getId();
        User user = userService.getById(userId);
        user.setPassword(userService.encodePassword(newPassword));

        // keep the loaded entity in line with the row the update above changed
        token.setUsed(true);
        token.setValid(false);

        // remove session if exists
        sessionService.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public PasswordLinkResource issueAdminLink(int userId, int issuedBy, boolean sendEmail) {
        // findById locks the user row, so links issued at the same time for one user queue up.
        // Not UserNotFoundException: only the catch-all handler takes that, which answers 500.
        User user = userService.findById(userId).orElseThrow(() -> new GeneralServiceException(
                HttpStatus.NOT_FOUND, ExceptionConstant.USER_NOT_EXIST, "User not found."));

        if (!isLocalAccount(user)) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.PASSWORD_MANAGED_EXTERNALLY,
                    "Password is managed externally.");
        }
        if (sendEmail && user.getEmail() == null) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, ExceptionConstant.EMAIL_NOT_FOUND,
                    "The user has no email to send the link to.");
        }

        // a user holds at most one valid token, which findByUserIdAndValidTrue relies on
        tokenRepository.invalidateValidTokensByUserId(userId);

        String rawToken = generateToken();
        Instant expiresAt = expiryFromNow(adminLinkActivityTime);

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(hashToken(rawToken));
        token.setPurpose(PasswordResetToken.Purpose.ADMIN_LINK);
        token.setExpiresAt(Date.from(expiresAt));
        token.setCreatedBy(issuedBy);
        tokenRepository.save(token);

        String link = buildLink(rawToken);
        // Sent last: if it fails, the transaction rolls back and the previous token stays valid.
        if (sendEmail && !emailService.sendMessage(user.getEmail(), "Set Password", link)) {
            throw new ServiceUnavailableException(ExceptionConstant.EMAIL_RECOVERY_FAILED, "There is an issue with your email configuration. For security reasons, the detailed error message has been written to your Opencelium logs. Please review the logs for more information.");
        }

        logger.info("Admin {} issued a set-password link for user {}, valid until {}, emailed: {}",
                issuedBy, userId, expiresAt, sendEmail);
        return new PasswordLinkResource(link, expiresAt);
    }

    public boolean isExpired(PasswordResetToken token) {
        return Instant.now().isAfter(expiryOf(token));
    }

    /*
    Whole seconds, the precision of the expires_at column, so the expiry returned to an admin is
    the one stored.
    */
    private static Instant expiryFromNow(long lifetimeMillis) {
        return Instant.now().plusMillis(lifetimeMillis).truncatedTo(ChronoUnit.SECONDS);
    }

    private Instant expiryOf(PasswordResetToken token) {
        if (token.getExpiresAt() != null) {
            return token.getExpiresAt().toInstant();
        }
        // stored before expires_at existed, when every token was a self-service one
        return token.getCreatedAt().toInstant().plusMillis(tokenActivityTime);
    }

    /*
    Same rule as UserService.findLocalAccount: an account whose password OC checks. LDAP users
    authenticate against the directory, and BASIC rows without a password are LDAP users created
    before the auth_method column existed. Giving one of those a password would make login check
    it locally instead of asking the directory.
    */
    private static boolean isLocalAccount(User user) {
        return user.getAuthMethod() == AuthMethod.BASIC && user.getPassword() != null;
    }

    private String buildLink(String rawToken) {
        return "%s?token=%s".formatted(baseUrl, rawToken);
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

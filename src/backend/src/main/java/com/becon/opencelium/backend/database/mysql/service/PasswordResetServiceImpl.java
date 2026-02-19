package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.PasswordResetToken;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.PasswordResetTokenRepository;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {
    private final UserService userService;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailServiceImpl emailService;
    private final PasswordEncoder passwordEncoder;

    private static final Duration TOKEN_EXPIRATION_TIME = Duration.ofMinutes(15);

    public PasswordResetServiceImpl(
            UserService userService,
            PasswordResetTokenRepository tokenRepository,
            EmailServiceImpl emailService,
            PasswordEncoder passwordEncoder
    ) {
        this.userService = userService;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void requestReset(String email) {
        userService.findByEmail(email).ifPresent(user -> {
            // TODO: process old tokens

            String rawToken = generateToken();
            String hashedToken = hashToken(rawToken);

            PasswordResetToken token = new PasswordResetToken();
            token.setUserId(user.getId());
            token.setToken(hashedToken);

            tokenRepository.save(token);

            emailService.sendMessage(user.getEmail(), "Reset Password", rawToken);
        });
    }

    @Override
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String hashedToken = hashToken(rawToken);

        PasswordResetToken token = tokenRepository
                .findByTokenHashAndUsedFalse(hashedToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        // TODO: validate expiration

        User user = userService.getById(token.getUserId());
        user.setPassword(passwordEncoder.encode(newPassword));

        token.setUsed(true);
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

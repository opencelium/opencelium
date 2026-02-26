package com.becon.opencelium.backend.database.mysql.service;

public interface PasswordResetService {
    void requestReset(String email, String clientIp);
    void resetPassword(String rawToken, String newPassword);
}
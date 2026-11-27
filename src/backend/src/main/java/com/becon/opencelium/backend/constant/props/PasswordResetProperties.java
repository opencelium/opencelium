package com.becon.opencelium.backend.constant.props;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "opencelium.forgot-psw")
public class PasswordResetProperties {
    private String baseUrl;
    private long tokenActivityTime = 240_000; // 4 minutes
    private int maxEmailValidationAttempts = 3;
    private long lockoutTime = 480_000; // 8 minutes
    private long adminLinkActivityTime = 86_400_000; // 24 hours: lifetime of a link an admin issues

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public long getTokenActivityTime() {
        return tokenActivityTime;
    }

    public void setTokenActivityTime(long tokenActivityTime) {
        this.tokenActivityTime = tokenActivityTime;
    }

    public int getMaxEmailValidationAttempts() {
        return maxEmailValidationAttempts;
    }

    public void setMaxEmailValidationAttempts(int maxEmailValidationAttempts) {
        this.maxEmailValidationAttempts = maxEmailValidationAttempts;
    }

    public long getLockoutTime() {
        return lockoutTime;
    }

    public void setLockoutTime(long lockoutTime) {
        this.lockoutTime = lockoutTime;
    }

    public long getAdminLinkActivityTime() {
        return adminLinkActivityTime;
    }

    public void setAdminLinkActivityTime(long adminLinkActivityTime) {
        this.adminLinkActivityTime = adminLinkActivityTime;
    }
}

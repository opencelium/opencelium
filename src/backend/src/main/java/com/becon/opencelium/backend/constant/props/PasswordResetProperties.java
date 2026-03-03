package com.becon.opencelium.backend.constant.props;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "opencelium.forgot-psw")
public class PasswordResetProperties {
    private String baseUrl;
    private long tokenActivityTime = 60_000; // 1 minute
    private int maxEmailValidationAttempts = 2;
    private long lockoutTime = 180_000; // 3 minutes

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
}

package com.becon.opencelium.backend.resource.v5.connection;

public class RetryOnErrorDTO {

    private Integer maxAttempts;

    private Long backoffMs;

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Long getBackoffMs() {
        return backoffMs;
    }

    public void setBackoffMs(Long backoffMs) {
        this.backoffMs = backoffMs;
    }
}

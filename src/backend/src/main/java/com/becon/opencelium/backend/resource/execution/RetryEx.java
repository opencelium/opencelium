package com.becon.opencelium.backend.resource.execution;

public class RetryEx {
    private Integer maxAttempts;

    private Integer backOffMs;

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Integer getBackOffMs() {
        return backOffMs;
    }

    public void setBackOffMs(Integer backOffMs) {
        this.backOffMs = backOffMs;
    }
}

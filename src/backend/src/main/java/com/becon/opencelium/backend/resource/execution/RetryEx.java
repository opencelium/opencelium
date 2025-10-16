package com.becon.opencelium.backend.resource.execution;

public class RetryEx {
    private Integer maxAttempts;

    private Long backOffMs;

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Long getBackOffMs() {
        return backOffMs;
    }

    public void setBackOffMs(Long backOffMs) {
        this.backOffMs = backOffMs;
    }
}

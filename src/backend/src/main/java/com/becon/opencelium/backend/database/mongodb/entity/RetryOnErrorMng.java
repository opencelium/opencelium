package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.mapping.Field;

public class RetryOnErrorMng {

    @Field(name = "max_attempts")
    private Integer maxAttempts;

    @Field(name = "backoff_ms")
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

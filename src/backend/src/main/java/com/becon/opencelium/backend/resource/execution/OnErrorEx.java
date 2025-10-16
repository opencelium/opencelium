package com.becon.opencelium.backend.resource.execution;

public class OnErrorEx {
    private String strategy;

    private RetryEx retry;

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public RetryEx getRetry() {
        return retry;
    }

    public void setRetry(RetryEx retry) {
        this.retry = retry;
    }
}

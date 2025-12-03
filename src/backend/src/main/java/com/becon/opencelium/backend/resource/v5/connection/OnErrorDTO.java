package com.becon.opencelium.backend.resource.v5.connection;

public class OnErrorDTO {

    private String strategy;

    private RetryOnErrorDTO retry;

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public RetryOnErrorDTO getRetry() {
        return retry;
    }

    public void setRetry(RetryOnErrorDTO retry) {
        this.retry = retry;
    }
}

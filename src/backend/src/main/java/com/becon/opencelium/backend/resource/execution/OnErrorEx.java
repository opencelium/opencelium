package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.enums.execution.HttpErrorHandlingStrategy;

public class OnErrorEx {
    private HttpErrorHandlingStrategy strategy;
    private RetryEx retry;

    public HttpErrorHandlingStrategy getStrategy() {
        return strategy;
    }

    public void setStrategy(HttpErrorHandlingStrategy strategy) {
        this.strategy = strategy;
    }

    public RetryEx getRetry() {
        return retry;
    }

    public void setRetry(RetryEx retry) {
        this.retry = retry;
    }
}

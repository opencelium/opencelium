package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.mapping.Field;

public class OnErrorMng {

    @Field(name = "strategy")
    private String strategy;

    @Field(name = "retry")
    private RetryOnErrorMng retry;

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public RetryOnErrorMng getRetry() {
        return retry;
    }

    public void setRetry(RetryOnErrorMng retry) {
        this.retry = retry;
    }
}

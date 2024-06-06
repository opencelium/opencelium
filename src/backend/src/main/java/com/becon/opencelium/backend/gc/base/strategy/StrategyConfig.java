package com.becon.opencelium.backend.gc.base.strategy;

public class StrategyConfig {
    private String strategy;
    private String cron;
    private long fixedDelay;
    private long initialDelay;

    public StrategyConfig(String strategy, String cron, long fixedDelay, long initialDelay) {
        this.strategy = strategy;
        this.cron = cron;
        this.fixedDelay = fixedDelay;
        this.initialDelay = initialDelay;
    }

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public String getCron() {
        return cron;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }

    public long getFixedDelay() {
        return fixedDelay;
    }

    public void setFixedDelay(long fixedDelay) {
        this.fixedDelay = fixedDelay;
    }

    public long getInitialDelay() {
        return initialDelay;
    }

    public void setInitialDelay(long initialDelay) {
        this.initialDelay = initialDelay;
    }
}

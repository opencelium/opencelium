package com.becon.opencelium.backend.gc.base.strategy;

public abstract class TriggerStrategyFactory {

    public static <T> GCTriggerStrategy getStrategy(StrategyConfig strategyConfig) {
        return switch (strategyConfig.getStrategy()) {
            case "on-restart" -> new OnApplicationReadyTriggerStrategy<T>();
            case "periodic" -> new PeriodicTriggerStrategy<T>(strategyConfig.getFixedDelay(), strategyConfig.getInitialDelay());
            case "cron" -> new CronTriggerStrategy<T>(strategyConfig.getCron());
            default -> new PeriodicTriggerStrategy<T>();
        };
    }
}

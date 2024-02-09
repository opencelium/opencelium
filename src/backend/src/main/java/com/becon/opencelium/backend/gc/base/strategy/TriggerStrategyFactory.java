package com.becon.opencelium.backend.gc.base.strategy;

public abstract class TriggerStrategyFactory {

    public static <T> GCTriggerStrategy getStrategy(StrategyConfig strategyConfig) {
        if(strategyConfig.getStrategy().equals("on-restart")){
            return new OnApplicationReadyTriggerStrategy<T>();
        }else if(strategyConfig.getStrategy().equals("periodic")){
            return new PeriodicTriggerStrategy<T>(strategyConfig.getFixedDelay(), strategyConfig.getInitialDelay());
        }if(strategyConfig.getStrategy().equals("cron")){
            return new CronTriggerStrategy<T>(strategyConfig.getCron());
        }else {
            return new PeriodicTriggerStrategy<T>();
        }
    }
}

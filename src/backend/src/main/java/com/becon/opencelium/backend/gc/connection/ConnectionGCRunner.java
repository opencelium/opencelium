package com.becon.opencelium.backend.gc.connection;

import com.becon.opencelium.backend.constant.YamlPropConst;
import com.becon.opencelium.backend.gc.base.Criteria;
import com.becon.opencelium.backend.gc.base.GCRunner;
import com.becon.opencelium.backend.gc.base.RunGCEvent;
import com.becon.opencelium.backend.gc.base.strategy.StrategyConfig;
import com.becon.opencelium.backend.gc.base.strategy.TriggerStrategyFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class ConnectionGCRunner extends GCRunner<ConnectionForGC> {
    private final Criteria<ConnectionForGC> criteria;
    private final boolean on;
    private static final String DEFAULT_STRATEGY_STRING = "periodic";
    private static final String DEFAULT_GC_IS_ON_STRING = "false";

    public ConnectionGCRunner(ConnectionGC connectionGC, Environment env) {
        super(connectionGC, null);

        this.criteria = setCriteria();

        on = Boolean.parseBoolean(env.getProperty(YamlPropConst.GC_CONNECTION_IS_ON, DEFAULT_GC_IS_ON_STRING));
        String strategy = env.getProperty(YamlPropConst.GC_CONNECTION_STRATEGY, DEFAULT_STRATEGY_STRING);
        String cron = env.getProperty(YamlPropConst.GC_CONNECTION_CRON);
        long fixedDelay = Long.parseLong(env.getProperty(YamlPropConst.GC_CONNECTION_FIXED_DELAY, "-1"));
        long initialDelay = Long.parseLong(env.getProperty(YamlPropConst.GC_CONNECTION_INITIAL_DELAY, "-1"));

        StrategyConfig strategyConfig = new StrategyConfig(strategy, cron, fixedDelay, initialDelay);

        this.trigger = TriggerStrategyFactory.<ConnectionForGC>getStrategy(strategyConfig);
    }

    @Override
    @EventListener(ApplicationReadyEvent.class)
    public void startGC() {
        if (on) {
            garbageCollector.start(criteria);
            trigger.startTrigger();
        }
    }

    @Override
    public void runGC() {
        garbageCollector.sweep();
    }

    @Override
    public void stopGC() {
        trigger.shutdown();
        garbageCollector.stop();
    }

    //listens the trigger
    @EventListener
    private void triggerListener(RunGCEvent<ConnectionForGC> event) {
        runGC();
    }

    private Criteria<ConnectionForGC> setCriteria() {
        return Criteria.<ConnectionForGC>builder()
                .and(c -> c.getConnection().getTitle() != null)
                .and(c -> !c.getConnection().getTitle().matches("!\\*test_connection_[0-9]{13}_operator_test"))
                .build();
    }
}

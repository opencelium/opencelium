package com.becon.opencelium.backend.gc.base;

import com.becon.opencelium.backend.gc.base.strategy.GCTriggerStrategy;

public abstract class GCRunner<T> {
    protected GarbageCollector<T> garbageCollector;
    protected GCTriggerStrategy trigger;

    public GCRunner(GarbageCollector<T> garbageCollector, GCTriggerStrategy trigger) {
        this.garbageCollector = garbageCollector;
        this.trigger = trigger;
    }

    public abstract void startGC(); // starts gc and trigger
    public abstract void runGC(); // triggered by GCTrigger
    public abstract void stopGC(); // stops gc and trigger
}

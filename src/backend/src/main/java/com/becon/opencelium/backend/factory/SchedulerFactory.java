package com.becon.opencelium.backend.factory;

import com.becon.opencelium.backend.quartz.QuartzJobScheduler;
import com.becon.opencelium.backend.quartz.SchedulingStrategy;
import org.quartz.Scheduler;

public abstract class SchedulerFactory {
    public static SchedulingStrategy createQuartzScheduler(Scheduler scheduler){
        return new QuartzJobScheduler(scheduler);
    }
}
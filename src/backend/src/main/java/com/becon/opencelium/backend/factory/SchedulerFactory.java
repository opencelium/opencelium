package com.becon.opencelium.backend.factory;

import com.becon.opencelium.backend.jobexecutor.QuartzJobScheduler;
import com.becon.opencelium.backend.jobexecutor.SchedulingStrategy;
import org.quartz.Scheduler;
import org.quartz.core.QuartzScheduler;

public abstract class SchedulerFactory {
    public static SchedulingStrategy createQuartzScheduler(Scheduler scheduler){
        return new QuartzJobScheduler(scheduler);
    }
}
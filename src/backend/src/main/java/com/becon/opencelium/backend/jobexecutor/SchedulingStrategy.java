package com.becon.opencelium.backend.jobexecutor;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import org.quartz.SchedulerException;

import java.text.ParseException;
import java.util.Map;

public interface SchedulingStrategy {
    void addJob(Scheduler scheduler);
    void deleteJob(Scheduler scheduler);
    void rescheduleJob(Scheduler scheduler);
    void runJob(Scheduler scheduler);
    void resumeJob(Scheduler scheduler);
    void pauseJob(Scheduler scheduler);
    Map<Integer,Long> getRunningJobs();
    void validateCron(String cron);
}

package com.becon.opencelium.backend.quartz;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;

import java.util.List;
import java.util.Map;

public interface SchedulingStrategy {
    void addJob(Scheduler scheduler);
    void deleteJob(Scheduler scheduler);
    void rescheduleJob(Scheduler scheduler, Long oldCon);
    void runJob(Scheduler scheduler);
    void runJob(Scheduler scheduler, Map<String, Object> webhookVars);
    void runJob(Scheduler scheduler, List<MaskingRule> rules);
    void resumeJob(Scheduler scheduler);
    void pauseJob(Scheduler scheduler);
    Map<Long,Integer> getRunningJobs();
    void validateCron(String cron);
    void terminate(Scheduler scheduler);
}

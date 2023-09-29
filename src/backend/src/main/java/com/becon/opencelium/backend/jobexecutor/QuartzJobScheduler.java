package com.becon.opencelium.backend.jobexecutor;

import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.exception.SchedulerNotFoundException;
import org.quartz.*;
import org.quartz.core.QuartzScheduler;

import java.io.Serializable;
import java.text.ParseException;
import java.util.Map;
import java.util.stream.Collectors;

import static org.quartz.TriggerBuilder.newTrigger;

public class QuartzJobScheduler implements SchedulingStrategy {
    private final org.quartz.Scheduler quartzScheduler;

    public QuartzJobScheduler(org.quartz.Scheduler quartzScheduler) {
        this.quartzScheduler = quartzScheduler;
    }

    @Override
    public void addJob(Scheduler scheduler) {
        try {
            final String jobName = getJobName(scheduler);
            final JobKey jobKey = new JobKey(jobName, "connection");
            //s-c
            //s, c
            validateCron(scheduler.getCronExp());

            if (quartzScheduler.checkExists(jobKey)) {
                return;
            }

            TriggerKey triggerKey = new TriggerKey(String.valueOf(scheduler.getId()), String.valueOf(scheduler.getConnection().getId()));

            ScheduleData data = new ScheduleData(scheduler.getId(), TriggerType.SCHEDULER);
            JobDataMap jobDataMap = new JobDataMap() {{
                put("data", data);
            }};

            JobDetail jobDetail = JobBuilder.newJob(JobExecutor.class)
//                    .storeDurably(false) // job to be deleted automatically when there are no longer active trigger associated to it
                    .withIdentity(jobKey)
                    .usingJobData(jobDataMap)
                    .build();

            CronTrigger trigger = newTrigger()
                    .withIdentity(triggerKey)
                    .withSchedule(
                            CronScheduleBuilder
                                    .cronSchedule(scheduler.getCronExp())
//                                    .withMisfireHandlingInstructionFireAndProceed() //fires misfired jobs firstly
                    ).forJob(jobKey)
                    .build();

            quartzScheduler.scheduleJob(jobDetail, trigger);
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteJob(Scheduler scheduler) {
        final String jobName = getJobName(scheduler);
        JobKey jobKey = new JobKey(jobName, "connection");

        try {
            if (!quartzScheduler.checkExists(jobKey))
                return;
            quartzScheduler.deleteJob(jobKey); //Deleting a job and unScheduling all of its Triggers
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void rescheduleJob(Scheduler scheduler) {
        final String jobName = getJobName(scheduler);
        final JobKey jobKey = new JobKey(jobName, "connection");
        validateCron(scheduler.getCronExp());

        try {
            Trigger currTrigger = quartzScheduler.getTrigger(new TriggerKey(String.valueOf(scheduler.getId()), String.valueOf(scheduler.getConnection().getId())));
            if (currTrigger == null) {
                return;
            }

            CronTrigger newTrigger = newTrigger()
                    .withIdentity(currTrigger.getKey())
                    .withSchedule(CronScheduleBuilder.cronSchedule(scheduler.getCronExp()))
                    .forJob(jobKey)
                    .build();

            quartzScheduler.rescheduleJob(currTrigger.getKey(), newTrigger);
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void runJob(Scheduler scheduler) {
        final String jobName = getJobName(scheduler);
        final JobKey jobKey = new JobKey(jobName, "connection");

        TriggerKey triggerKey = new TriggerKey("FIRES_ONCE-" + scheduler.getId(), String.valueOf(scheduler.getConnection().getId()));
        Trigger trigger = newTrigger()
                .forJob(jobKey)
                .withIdentity(triggerKey)
                .startNow()
                .build();

        try {
            boolean isPresent = quartzScheduler.checkExists(jobKey);
            if (isPresent) {
                quartzScheduler.scheduleJob(trigger);
            } else {
                ScheduleData data = new ScheduleData(scheduler.getId(), TriggerType.SCHEDULER);
                JobDataMap jobDataMap = new JobDataMap() {{
                    put("data", data);
                }};
                JobDetail jobDetail = JobBuilder.newJob(JobExecutor.class)
//                        .storeDurably(false)
                        .withIdentity(jobKey)
                        .usingJobData(jobDataMap)
                        .build();
                quartzScheduler.scheduleJob(jobDetail, trigger);
            }
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void resumeJob(Scheduler scheduler) {
        final String jobName = getJobName(scheduler);
        JobKey jobKey = new JobKey(jobName, "connection");
        try {
            if (!quartzScheduler.checkExists(jobKey))
                return;
            quartzScheduler.resumeJob(jobKey);
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void pauseJob(Scheduler scheduler) {
        final String jobName = getJobName(scheduler);
        JobKey jobKey = new JobKey(jobName, "connection");
        try {
            if (!quartzScheduler.checkExists(jobKey))
                return;
            quartzScheduler.pauseJob(jobKey);
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public Map<Integer, Long> getRunningJobs() {
        try {
            return quartzScheduler.getCurrentlyExecutingJobs()
                    .stream()
                    .map(JobExecutionContext::getJobDetail)
                    .map(JobDetail::getKey)
                    .collect(Collectors.toMap(e -> Integer.parseInt(e.getName().split("-")[0]), e -> Long.valueOf(e.getName().split("-")[1])));
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void validateCron(String cron) {
        try {
            new CronExpression(cron);
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }

    private String getJobName(Scheduler scheduler) {
        if (scheduler == null || scheduler.getId() == 0) {
            throw new SchedulerNotFoundException(0);
        }
        if (scheduler.getConnection() == null || scheduler.getConnection().getId() == null) {
            throw new ConnectionNotFoundException(0L);
        }
        return scheduler.getId() + "-" + scheduler.getConnection().getId();
    }

    enum TriggerType {
        SCHEDULER, WEBHOOK
    }

    static class ScheduleData implements Serializable {
        private int scheduleId;
        private TriggerType execType;

        public ScheduleData(int scheduleId, TriggerType execType) {
            this.scheduleId = scheduleId;
            this.execType = execType;
        }

        public int getScheduleId() {
            return scheduleId;
        }

        public void setScheduleId(int scheduleId) {
            this.scheduleId = scheduleId;
        }

        public TriggerType getExecType() {
            return execType;
        }

        public void setExecType(TriggerType execType) {
            this.execType = execType;
        }
    }
}

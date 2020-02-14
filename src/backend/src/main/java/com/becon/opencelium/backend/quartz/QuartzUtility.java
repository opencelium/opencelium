/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.quartz;

import com.becon.opencelium.backend.mysql.entity.Scheduler;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuartzUtility {

    @Autowired
    private org.quartz.Scheduler quartzScheduler;

    public void addJob(Scheduler scheduler) throws Exception{
        JobKey jobKey = getJobKey(scheduler);
        JobDetail jobDetail = quartzScheduler.getJobDetail(jobKey);
        if(jobDetail == null){
            jobDetail = buildJobDetail(scheduler);
            Trigger trigger = buildTrigger(scheduler,jobDetail);
            quartzScheduler.scheduleJob(jobDetail,trigger);
            return;
        }

        Trigger trigger = buildTrigger(scheduler,jobDetail);
        quartzScheduler.scheduleJob(trigger);

    }

    public void deleteJob(Scheduler scheduler) throws Exception{
        JobKey jobKey = getJobKey(scheduler);
        quartzScheduler.deleteJob(jobKey);
        quartzScheduler.unscheduleJob(getTriggerKey(scheduler));
    }

    public void rescheduleJob(Scheduler scheduler) throws Exception {
        //TODO: get new job or get existed job
        JobKey jobKey = getJobKey(scheduler);
        JobDetail jobDetail = quartzScheduler.getJobDetail(jobKey);
        TriggerKey oldKey = getTriggerKey(scheduler);
        Trigger trigger = buildTrigger(scheduler, jobDetail);
        quartzScheduler.rescheduleJob(oldKey, trigger);
    }

    public void scheduleJob(Scheduler scheduler) throws Exception {
        JobKey jobKey = getJobKey(scheduler);
        JobDetail jobDetail = quartzScheduler.getJobDetail(jobKey);
        Trigger trigger = buildTrigger(scheduler,jobDetail);
        quartzScheduler.scheduleJob(trigger);
    }

    public void addSchedule(Scheduler scheduler) throws Exception{
        JobKey jobKey = getJobKey(scheduler);
        JobDetail jobDetail = quartzScheduler.getJobDetail(jobKey);
        Trigger trigger = buildTrigger(scheduler, jobDetail);
        quartzScheduler.scheduleJob(trigger);
    }

    public void unscheduleJob(Scheduler scheduler) throws Exception{
        TriggerKey triggerKey = getTriggerKey(scheduler);
        quartzScheduler.unscheduleJob(triggerKey);
    }

    public void runJob(Long connectionId) throws Exception{
        // jobIdentity = connectionId.connection
        JobKey jobKey = JobKey.jobKey(Long.toString(connectionId), "connection");
        JobDetail jobDetail = quartzScheduler.getJobDetail(jobKey);

        if (jobDetail == null){
            JobDataMap jobDataMap = new JobDataMap();
            // mapping in context
            jobDataMap.put("connectionId", connectionId);
            jobDataMap.put("executionType", "webhook");
            jobDetail = org.quartz.JobBuilder.newJob(JobExecutor.class)
                    .withIdentity(Long.toString(connectionId), "connection")
                    .withDescription("runJob")
                    .usingJobData(jobDataMap)
                    .storeDurably()
                    .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity(connectionId.toString(), "connection")
                    .forJob(jobDetail)
                    .startNow()
                    .build();

            quartzScheduler.scheduleJob(jobDetail,trigger);
            return;
        }

        // Define a Trigger that will fire "now" and associate it with the existing job
        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity(connectionId.toString(), "connection")
                .forJob(jobDetail)
                .startNow()
                .build();

        // Schedule the trigger
        quartzScheduler.scheduleJob(trigger);
    }

    public void runJob(Scheduler scheduler) throws Exception{
        Long connectionId = scheduler.getConnection().getId();
        int schedulerId = scheduler.getId();
        String name = connectionId + "-" + schedulerId;
        JobKey jobKey = JobKey.jobKey(name, "connection");
        JobDetail jobDetail = quartzScheduler.getJobDetail(jobKey);
        Integer schedulerIdDataMap = (Integer) jobDetail.getJobDataMap().get("schedulerId");
        JobDataMap jobDataMap = new JobDataMap();

        if (jobDetail == null){
            // mapping in context
            jobDataMap.put("connectionId", connectionId);
            jobDataMap.put("schedulerId", scheduler.getId());
            jobDataMap.put("executionType", "scheduler");
            jobDetail = org.quartz.JobBuilder.newJob(JobExecutor.class)
                    .withIdentity(name, "connection")
                    .withDescription("runJob")
                    .usingJobData(jobDataMap)
                    .storeDurably()
                    .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity(Integer.toString(schedulerId), Long.toString(connectionId))
                    .forJob(jobDetail)
                    .startNow()
                    .build();

            quartzScheduler.scheduleJob(jobDetail,trigger);
            return;
        }

        if (schedulerIdDataMap == null){
            jobDetail.getJobDataMap().put("schedulerId", scheduler.getId());
            quartzScheduler.addJob(jobDetail, true);
        }

        // Define a Trigger that will fire "now" and associate it with the existing job
        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity(Integer.toString(schedulerId) + "-now", Long.toString(connectionId))
                .forJob(jobDetail)
                .startNow()
                .build();

        // Schedule the trigger
        quartzScheduler.scheduleJob(trigger);
    }

    public void pauseTrigger(Scheduler scheduler) throws SchedulerException{
        quartzScheduler.pauseTrigger(getTriggerKey(scheduler));
    }

    public void resumeTrigger(Scheduler scheduler) throws SchedulerException{
        quartzScheduler.resumeTrigger(getTriggerKey(scheduler));
    }

    public void pauseJob(Scheduler scheduler) throws SchedulerException{
        quartzScheduler.pauseJob(getJobKey(scheduler));
    }

    public void resumeJob(Scheduler scheduler) throws SchedulerException{
        quartzScheduler.resumeJob(getJobKey(scheduler));
    }

    public Map<Integer, Long> getRunningJobsData() throws Exception{
        List<JobExecutionContext> jobExecutionContext = quartzScheduler.getCurrentlyExecutingJobs();

        List<JobDataMap> jobDataMaps = jobExecutionContext.stream()
                .map(job -> job.getJobDetail().getJobDataMap())
                .collect(Collectors.toList());

        return jobDataMaps.stream()
                .collect(Collectors.toMap(c -> c.getIntValue("schedulerId"),
                        c -> c.getLongValue("connectionId")));
    }


// ======================================== private zone ============================================== //

    private JobKey getJobKey(Scheduler scheduler) {
        String name = Long.toString(scheduler.getConnection().getId()) + "-" + scheduler.getId();
        return JobKey.jobKey(name, "connection");
    }

    private TriggerKey getTriggerKey(Scheduler scheduler) {
        String connectionId = Long.toString(scheduler.getConnection().getId());
        String schedulerId = Integer.toString(scheduler.getId());
        return TriggerKey.triggerKey(schedulerId, connectionId);
    }

    private JobDetail buildJobDetail(Scheduler scheduler) throws Exception {
        String name = Long.toString(scheduler.getConnection().getId()) + "-" + scheduler.getId();
        JobKey jobKey = JobKey.jobKey(name, "connection");
        JobDetail jobDetail = quartzScheduler.getJobDetail(jobKey);
        if (jobDetail != null){
            return jobDetail;
        }
        JobDataMap jobDataMap = buildJobDataMap(scheduler);

        //jobIdentity = schedulerId.connection
        return org.quartz.JobBuilder.newJob(JobExecutor.class)
                .withIdentity(name, "connection")
                .withDescription(scheduler.getTitle())
                .usingJobData(jobDataMap)
                .storeDurably()
                .build();
    }

    private JobDataMap buildJobDataMap(Scheduler scheduler){
        JobDataMap jobDataMap = new JobDataMap();
        Long connectionId = scheduler.getConnection().getId();
        jobDataMap.put("connectionId", connectionId);
        jobDataMap.put("schedulerId", scheduler.getId());
        jobDataMap.put("executionType", "scheduler");

        return jobDataMap;
    }

    private Trigger buildTrigger(Scheduler scheduler, JobDetail jobDetail) throws Exception {
        String schedulerId = Integer.toString(scheduler.getId());
        String connectionId = Long.toString((Long)jobDetail.getJobDataMap().get("connectionId")) ;
        String cronExp = scheduler.getCronExp();

        return TriggerBuilder.newTrigger()
                .forJob(jobDetail)
                .withIdentity(schedulerId, connectionId)
                .withSchedule(CronScheduleBuilder.cronSchedule(cronExp).withMisfireHandlingInstructionDoNothing())
                .build();
    }
}

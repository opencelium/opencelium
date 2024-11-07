package com.becon.opencelium.backend.subscription.quartz;

import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;

public class QuartzCronUpdater {

    private final Scheduler scheduler;

    public QuartzCronUpdater(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    public void updateCronExpression(String triggerName, String triggerGroup, String newCronExpression) {
        try {
            TriggerKey triggerKey = TriggerKey.triggerKey(triggerName, triggerGroup);

            // Retrieve the current trigger
            CronTrigger oldTrigger = (CronTrigger) scheduler.getTrigger(triggerKey);

            if (oldTrigger == null) {
                System.out.println("Trigger not found with key: " + triggerKey);
                return;
            }

            // Check if the cron expression is different
            if (oldTrigger.getCronExpression().equals(newCronExpression)) {
                System.out.println("Cron expression is already set to the new value.");
                return;
            }

            // Build the new trigger with the new cron expression
            CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule(newCronExpression);

            TriggerBuilder<CronTrigger> triggerBuilder = oldTrigger.getTriggerBuilder();

            CronTrigger newTrigger = triggerBuilder
                    .withSchedule(scheduleBuilder)
                    .build();

            // Reschedule the job with the new trigger
            Date rescheduledDate = scheduler.rescheduleJob(triggerKey, newTrigger);

            System.out.println("Cron expression updated to: " + newCronExpression + ", rescheduled at: " + rescheduledDate);

        } catch (SchedulerException e) {
            e.printStackTrace();
        }
    }
}

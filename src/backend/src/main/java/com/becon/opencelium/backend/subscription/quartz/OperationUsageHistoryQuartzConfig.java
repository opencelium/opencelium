package com.becon.opencelium.backend.subscription.quartz;

import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OperationUsageHistoryQuartzConfig {
    @Bean
    public JobDetail dailyJobDetail() {
        return JobBuilder.newJob(OperationUsageReportJob.class)
                .withIdentity("operationUsageReportJob")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger dailyJobTrigger() {
        String cron = "00 00 23 * * ?";
        return TriggerBuilder.newTrigger()
                .forJob(dailyJobDetail())
                .withIdentity("operationUsageReportJobTrigger")
                .withSchedule(CronScheduleBuilder.cronSchedule(cron))
                .build();
    }
}

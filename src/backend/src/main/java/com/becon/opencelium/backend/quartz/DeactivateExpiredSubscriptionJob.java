package com.becon.opencelium.backend.quartz;

import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.quartz.QuartzJobBean;

public class DeactivateExpiredSubscriptionJob extends QuartzJobBean {

    private final SubscriptionService subscriptionService;

    public DeactivateExpiredSubscriptionJob(@Qualifier("subscriptionServiceImpl") SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Override
    protected void executeInternal(JobExecutionContext context) {
        String subId = context.getJobDetail().getJobDataMap().getString("localSubId");
        subscriptionService.deactivateExpiredSubscription(subId);
    }
}
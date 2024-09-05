package com.becon.opencelium.backend.quartz;

import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import org.quartz.JobExecutionContext;
import org.quartz.JobKey;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.quartz.QuartzJobBean;

public class ResetLimitsJob extends QuartzJobBean {
    private final SubscriptionService subscriptionService;

    public ResetLimitsJob(@Qualifier("subscriptionServiceImp") SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Override
    public void executeInternal(JobExecutionContext context) {
        JobKey key = context.getJobDetail().getKey();
        String id = key.getName().split("-")[1];
        Subscription subscription = subscriptionService.getById(id);
        subscription.setCurrentUsage(0L);
        subscription.setCurrentUsageHmac(HmacUtility
                .encode(subscription.getId().toString() + subscription.getCurrentUsage()));
        subscriptionService.save(subscription);
    }
}

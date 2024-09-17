package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.SubscriptionRepository;
import com.becon.opencelium.backend.quartz.ResetLimitsJob;
import com.becon.opencelium.backend.resource.subs.SubsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.utility.MachineUtility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import org.quartz.*;
import org.quartz.impl.matchers.GroupMatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.UUID;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final Scheduler scheduler;
    private final ConnectionService connectionService;
    private final OperationUsageHistoryService operationUsageHistoryService;
    private final Logger logger = LoggerFactory.getLogger(SubscriptionServiceImpl.class);

    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   Scheduler scheduler,
                                   @Qualifier("connectionServiceImp") ConnectionService connectionService,
                                   @Qualifier("operationUsageHistoryServiceImpl") OperationUsageHistoryService operationUsageHistoryService) {
        this.subscriptionRepository = subscriptionRepository;
        this.scheduler = scheduler;
        this.connectionService =connectionService;
        this.operationUsageHistoryService = operationUsageHistoryService;
    }

    @Override
    public LicenseKey decryptLicenseKey(String license) {
        return LicenseKeyUtility.decrypt(license);
    }

    @Override
    public boolean isValid(Subscription sub) {
        LicenseKey licenseKey = LicenseKeyUtility.decrypt(sub.getLicenseKey());
        if (!LicenseKeyUtility.verify(licenseKey, sub.getActivationRequest())) {
            return false;
        }
        if (!isCurrentUsageIsValid(sub)) {
            logger.warn("Usage number of operation has been changed manually.");
            return false;
        }
        if (licenseKey.getOperationUsage() != 0 && sub.getCurrentUsage() > licenseKey.getOperationUsage()) {
            logger.warn("You have reached limit of operation usage: " + licenseKey.getOperationUsage());
            return false;
        }
        return true;
    }

    private boolean isHmacValid(Subscription sub, String hmac) {
        return HmacUtility.verify(sub.getActivationRequest().getId() + MachineUtility.getStringForHmacEncode(), hmac);
    }

    @Override
    public void save(Subscription subscription) {
        deactivateAll();
        subscription.setCurrentUsageHmac(HmacUtility
                .encode(subscription.getId() + subscription.getCurrentUsage()));
        initTask(subscription);
        subscriptionRepository.save(subscription);
    }

    @Override
    public boolean exists(String subId) {
        return false;
    }

    @Override
    public Subscription convertToSub(String licenseKey) {
        return null;
    }

    @Override
    public Subscription buildFromLicenseKey(LicenseKey licenseKey, ActivationRequest ar) {
        Subscription subscription = subscriptionRepository.findBySubId(licenseKey.getSubId()).orElse(null);
        if (subscription == null) {
            subscription = new Subscription();
            subscription.setId(UUID.randomUUID().toString());
        }
        subscription.setSubId(licenseKey.getSubId());
        subscription.setCreatedAt(LocalDateTime.now());
        subscription.setCurrentUsage(0L);
        subscription.setActive(true);
        subscription.setCurrentUsageHmac(HmacUtility
                .encode(subscription.getId() + subscription.getCurrentUsage()));
        return subscription;
    }

    @Override
    public void deactivateAll() {
        subscriptionRepository.deactivateAll();
        killAllTasks();
    }

    @Override
    public Subscription getActiveSubs() {
        return subscriptionRepository.findFirstByActiveTrue().orElse(null);
    }

    @Override
    public SubsDTO toDto(LicenseKey licenseKey, Subscription subscription) {
        SubsDTO subsDTO = new SubsDTO();
        subsDTO.setActive(subscription.isActive());
        subsDTO.setSubId(subscription.getSubId());
        subsDTO.setCurrentOperationUsage(subscription.getCurrentUsage());

        subsDTO.setDuration(licenseKey.getDuration());
        subsDTO.setType(licenseKey.getType());
        subsDTO.setStartDate(licenseKey.getStartDate());
        subsDTO.setEndDate(licenseKey.getEndDate());
        subsDTO.setTotalOperationUsage(licenseKey.getOperationUsage());
        return subsDTO;
    }

    @Override
    public Subscription getById(String id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subsction not found"));
    }

    @Override
    public void updateUsage(Subscription sub, long connectionId,long requestSize) {
        Connection connection = connectionService.getById(connectionId);
        OperationUsageHistory operationUsageHistory = operationUsageHistoryService
                .createEntity(sub.getSubId(), connection.getTitle(), requestSize);
        operationUsageHistoryService.save(operationUsageHistory);
        if (!isCurrentUsageIsValid(sub)) {
            throw new RuntimeException("Number of operations have been changed manually.");
        }

        long updatedOperationUsage = sub.getCurrentUsage() + requestSize;
        String newHmac = HmacUtility.encode(sub.getId() + updatedOperationUsage);
        sub.setCurrentUsage(updatedOperationUsage);
        sub.setCurrentUsageHmac(newHmac);
        save(sub);
    }

    private boolean isCurrentUsageIsValid(Subscription sub) {
        return HmacUtility
                    .verify(sub.getId() + sub.getCurrentUsage(), sub.getCurrentUsageHmac());
    }

    private void initTask(Subscription subscription) {
        String jobKey = "subs-" + subscription.getId();
        String groupKey = "subs-group";
        JobKey jobIdentity = new JobKey(jobKey, groupKey);

        try {
            // Check if the job already exists
            if (scheduler.checkExists(jobIdentity)) {
                // If the job exists, retrieve and update the trigger
                TriggerKey triggerKey = new TriggerKey("default", "default");

                LicenseKey lk = LicenseKeyUtility.decrypt(subscription.getLicenseKey());
                String cron = String.format("0 0 0 %d * ?", LocalDateTime
                        .ofInstant(Instant.ofEpochMilli(lk.getStartDate()), ZoneId.systemDefault())
                        .getDayOfMonth());

                // Create a new trigger with the updated schedule
                Trigger newTrigger = TriggerBuilder.newTrigger()
                        .withIdentity(triggerKey)
                        .withSchedule(CronScheduleBuilder.cronSchedule(cron))
                        .build();

                // Reschedule the existing job with the new trigger
                scheduler.rescheduleJob(triggerKey, newTrigger);
            } else {
                // If the job does not exist, create a new one
                JobDetail job = JobBuilder.newJob(ResetLimitsJob.class)
                        .withIdentity(jobKey, groupKey)
                        .build();

                LicenseKey lk = LicenseKeyUtility.decrypt(subscription.getLicenseKey());
                String cron = String.format("0 0 0 %d * ?", LocalDateTime
                        .ofInstant(Instant.ofEpochMilli(lk.getStartDate()), ZoneId.systemDefault())
                        .getDayOfMonth());

                Trigger trigger = TriggerBuilder.newTrigger()
                        .withIdentity("default", "default")
                        .withSchedule(CronScheduleBuilder.cronSchedule(cron))
                        .build();

                // Schedule the new job
                scheduler.scheduleJob(job, trigger);
            }
        } catch (SchedulerException e) {
            e.printStackTrace();
        }
    }

    private void killAllTasks() {
        try {
            for (String groupName : scheduler.getJobGroupNames()) {
                Set<JobKey> jobKeys = scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName));
                for (JobKey jobKey : jobKeys) {
                    scheduler.deleteJob(jobKey);
                }
            }
        } catch (SchedulerException e) {
            e.printStackTrace();
        }
    }
}

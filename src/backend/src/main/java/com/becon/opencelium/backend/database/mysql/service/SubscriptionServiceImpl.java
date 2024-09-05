package com.becon.opencelium.backend.database.mysql.service;

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
import org.springframework.beans.factory.annotation.Autowired;
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

    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository, Scheduler scheduler) {
        this.subscriptionRepository = subscriptionRepository;
        this.scheduler = scheduler;
    }

    @Override
    public boolean verifyLicenseKey(String licenseKey) {
        return false;
    }

    @Override
    public LicenseKey decryptLicenseKey(String license) {
        return LicenseKeyUtility.decrypt(license);
    }

    @Override
    public boolean isValid(Subscription subscription) {
        return false;
    }

    @Override
    public void save(Subscription subscription) {
        subscription.setCurrentUsageHmac(HmacUtility
                .encode(subscription.getId().toString() + subscription.getCurrentUsage()));
        initTask(subscription);
        subscriptionRepository.save(subscription);
    }

    @Override
    public boolean exists(String subId) {
        return false;
    }

    @Override
    public Subscription buildFromLicenseKey(LicenseKey licenseKey) {
        Subscription subscription = new Subscription();
        subscription.setId(UUID.randomUUID());
        subscription.setSubId(licenseKey.getSubId());
        subscription.setCreatedAt(LocalDateTime.now());
        subscription.setCurrentUsage(0L);
        subscription.setActive(true);
        subscription.setCurrentUsageHmac(HmacUtility
                .encode(subscription.getId().toString() + subscription.getCurrentUsage()));
        return subscription;
    }

    @Override
    public void deactivateAll() {
        subscriptionRepository.deactivateAll();
        killAllTasks();
    }

    @Override
    public Subscription getActiveSubs() {
        return null;
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
        return null;
    }

    private void initTask(Subscription subscription) {
        JobDetail job = JobBuilder.newJob(ResetLimitsJob.class)
                .withIdentity("subs-" + subscription.getId(), "subs-group")
                .build();
        LicenseKey lk = LicenseKeyUtility.decrypt(subscription.getLicenseKey());
        String cron = String.format("0 0 0 %d * ?", LocalDateTime
                .ofInstant(Instant.ofEpochMilli(lk.getStartDate()), ZoneId.systemDefault())
                .getDayOfMonth());
        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("default", "default")
                .withSchedule(CronScheduleBuilder.cronSchedule(cron))
                .build();
        try {
            scheduler.scheduleJob(job, trigger);
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

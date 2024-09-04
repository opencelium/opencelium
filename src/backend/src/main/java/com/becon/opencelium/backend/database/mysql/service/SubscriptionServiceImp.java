package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.SubscriptionRepository;
import com.becon.opencelium.backend.license.LicenseKey;
import com.becon.opencelium.backend.license.SubsDTO;
import com.becon.opencelium.backend.quartz.ResetLimitsJob;
import com.becon.opencelium.backend.utility.LicenseKeyUtility;
import org.quartz.*;
import org.quartz.impl.matchers.GroupMatcher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.UUID;

@Service
public class SubscriptionServiceImp implements SubscriptionService {
    private final SubscriptionRepository subscriptionRepository;
    private final Scheduler scheduler;

    public SubscriptionServiceImp(SubscriptionRepository subscriptionRepository, Scheduler scheduler) {
        this.subscriptionRepository = subscriptionRepository;
        this.scheduler = scheduler;
    }

    @Override
    public boolean verifyLicenseKey(String licenseKey) {
        return LicenseKeyUtility.verify(licenseKey);
    }

    @Override
    public LicenseKey decryptLicenseKey(String license) {
        return LicenseKeyUtility.decrypt(license);
    }

    @Override
    public boolean isValid(Subscription s) {
        LicenseKey licenseKey = LicenseKeyUtility.decrypt(s.getLicenseKey());
        if (licenseKey == null || licenseKey.getEndDate().isBefore(Instant.now()) || licenseKey.getStartDate().isAfter(Instant.now())) {
            return false;
        }
        return s.generateHmac().equals(s.getCurrentUsageHmac());
    }

    @Override
    public void save(Subscription subscription) {
        subscription.generateAndSetHmac();
        initTask(subscription);
        subscriptionRepository.save(subscription);
    }

    @Override
    public boolean exists(String subId) {
        return subscriptionRepository.existsById(UUID.fromString(subId));
    }

    @Override
    public Subscription buildFromLicenseKey(LicenseKey licenseKey) {
        Subscription subscription = new Subscription();
        subscription.setId(UUID.randomUUID());
        subscription.setSubId(licenseKey.getSubId());
        subscription.setCreatedAt(Instant.now());
        subscription.setStartDate(licenseKey.getStartDate());
        subscription.setCurrentUsage(0L);
        subscription.setActive(true);
        subscription.generateAndSetHmac();
        return subscription;
    }

    @Override
    public void deactivateAll() {
        subscriptionRepository.deactivateAll();
        killAllTasks();
    }

    @Override
    public Subscription getActiveSubs() {
        return subscriptionRepository.findActiveSubs().orElse(null);
    }

    @Override
    public SubsDTO toDto(LicenseKey licenseKey, Subscription subscription) {
        SubsDTO subsDTO = new SubsDTO();
        subsDTO.setActive(subscription.isActive());
        subsDTO.setSubsId(subscription.getSubId());
        subsDTO.setCurrentOperationUsage(subscription.getCurrentUsage());

        subsDTO.setDuration(licenseKey.getDuration());
        subsDTO.setType(licenseKey.getType());
        subsDTO.setStartDate(licenseKey.getStartDate().getEpochSecond());
        subsDTO.setEndDate(licenseKey.getEndDate().getEpochSecond());
        subsDTO.setTotalOperationUsage(licenseKey.getOperationUsage());
        return subsDTO;
    }

    @Override
    public Subscription getById(String id) {
        return subscriptionRepository.findById(UUID.fromString(id)).orElseThrow(() -> new RuntimeException("Subscription not found"));
    }

    private void initTask(Subscription subscription) {
        JobDetail job = JobBuilder.newJob(ResetLimitsJob.class)
                .withIdentity("subs-" + subscription.getId(), "subs-group")
                .build();

        String cron = String.format("0 0 0 %d * ?", LocalDateTime.ofInstant(subscription.getStartDate(), ZoneId.systemDefault()).getDayOfMonth());
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

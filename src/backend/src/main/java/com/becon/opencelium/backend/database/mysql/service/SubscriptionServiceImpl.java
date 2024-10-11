package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.constant.SubscriptionConstant;
import com.becon.opencelium.backend.database.mysql.entity.*;
import com.becon.opencelium.backend.database.mysql.repository.SubscriptionRepository;
import com.becon.opencelium.backend.quartz.ResetLimitsJob;
import com.becon.opencelium.backend.resource.subs.SubsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.utility.MachineUtility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import org.quartz.*;
import org.quartz.Scheduler;
import org.quartz.impl.matchers.GroupMatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
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
    private final OperationUsageHistoryDetailService operationUsageHistoryDetailService;
    private final ActivationRequestService activationRequestService;
    private final Logger logger = LoggerFactory.getLogger(SubscriptionServiceImpl.class);

    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   Scheduler scheduler,
                                   @Qualifier("connectionServiceImp") ConnectionService connectionService,
                                   @Qualifier("operationUsageHistoryServiceImpl") OperationUsageHistoryService operationUsageHistoryService,
                                   @Qualifier("operationUsageHistoryDetailServiceImp") OperationUsageHistoryDetailService operationUsageHistoryDetailService,
                                   @Qualifier("activationRequestServiceImp") ActivationRequestService activationRequestService) {
        this.subscriptionRepository = subscriptionRepository;
        this.scheduler = scheduler;
        this.connectionService =connectionService;
        this.operationUsageHistoryService = operationUsageHistoryService;
        this.operationUsageHistoryDetailService = operationUsageHistoryDetailService;
        this.activationRequestService = activationRequestService;
    }

    @Override
    public LicenseKey decryptLicenseKey(String license) {
        return LicenseKeyUtility.decrypt(license);
    }

    @Override
    public boolean isValid(Subscription sub) {
        if (sub == null) {
//            logger.warn("");
            throw new RuntimeException("No active subscription found. Please activate a free license or upload your license");
        }
        LicenseKey licenseKey = LicenseKeyUtility.decrypt(sub.getLicenseKey());
        boolean isValid = LicenseKeyUtility.verify(licenseKey, sub.getActivationRequest());
        if (!isCurrentUsageIsValid(sub)) {
            throw new RuntimeException("Usage number of operation has been changed manually.");
        }
        if (licenseKey.getOperationUsage() != 0 && sub.getCurrentUsage() > licenseKey.getOperationUsage()) {
            throw new RuntimeException("You have reached limit of operation usage: " + licenseKey.getOperationUsage());
        }
        return isValid;
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
    public void deleteBySubId(String subId) {
        subscriptionRepository.deleteBySubId(subId);
        activateDefault();
    }

    @Override
    public void deleteByLicenseId(String licenseId) {
        subscriptionRepository.deleteByLicenseId(licenseId);
        activateDefault();

    }

    @Override
    public boolean exists(String subId) {
        return subscriptionRepository.existsBySubId(subId);
    }

    @Override
    public Subscription convertToSub(String licenseKey, ActivationRequest ar) {
        LicenseKey lk = LicenseKeyUtility.decrypt(licenseKey);
        if (!LicenseKeyUtility.verify(lk, ar)) {
            throw new RuntimeException("LicenseKey is not valid");
        }
        Subscription subscription = subscriptionRepository.findBySubId(lk.getSubId()).orElse(null);
        if (subscription == null) {
            subscription = new Subscription();
            subscription.setId(UUID.randomUUID().toString());
        }
        subscription.setSubId(lk.getSubId());
        subscription.setCreatedAt(LocalDateTime.now());
        subscription.setCurrentUsage(0L);
        subscription.setActive(true);
        subscription.setCurrentUsageHmac(HmacUtility
                .encode(subscription.getId() + subscription.getCurrentUsage()));
        subscription.setActivationRequest(ar);
        subscription.setLicenseKey(licenseKey);
        subscription.setLicenseId(lk.getLicenseId());
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
        subsDTO.setSubId(licenseKey.getSubId());
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
    public void updateUsage(Subscription sub, long connectionId,long requestSize, long startTime) {
        Connection connection = connectionService.getById(connectionId);

        // Try to find existing operation usage history
        OperationUsageHistory operationUsageHistory = operationUsageHistoryService
                .findByConnectionTitle(connection.getTitle())
                .map(history -> {
                    // If history exists, increment its total usage
                    history.setTotalUsage(history.getTotalUsage() + requestSize);
                    // Create and add a new OperationUsageHistoryDetail
                    OperationUsageHistoryDetail newDetail = new OperationUsageHistoryDetail();
                    newDetail.setOperationUsage(requestSize);
                    newDetail.setStartDate(Instant.ofEpochMilli(startTime).atZone(ZoneId.systemDefault()).toLocalDateTime());
                    newDetail.setOperationUsageHistory(history);  // Set the bidirectional relationship
                    operationUsageHistoryDetailService.save(newDetail);
                    // Add the new detail to the existing list
//                    history.getDetails().add(newDetail);
                    return history;
                })
                .orElseGet(() -> {
                    // If no history exists, create a new one
                    return operationUsageHistoryService.createNewEntity(sub, connection.getTitle(), requestSize, startTime);
                });
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

    @Override
    public void createFreeLicenseFileIfNotExists() {
        String freeLicensePath = PathConstant.LICENSE + "init-license.txt";
        File file = new File(freeLicensePath);

        File parentDirectory = file.getParentFile();  // Get the parent directory

        // Check if the directory exists, and if not, create it
        if (parentDirectory != null && !parentDirectory.exists()) {
            if (parentDirectory.mkdirs()) {
                logger.info("Directories created: " + parentDirectory.getAbsolutePath());
            } else {
                throw new RuntimeException("Failed to create directories: " + parentDirectory.getAbsolutePath());
            }
        }
        if (file.exists()) {
            logger.info("Free license already exists.");
            return ;  // File already exists, no need to create it.
        }

        try {
            if (file.createNewFile()) {
                // Write the content to the file
                try (FileWriter writer = new FileWriter(file)) {
                    writer.write(SubscriptionConstant.FREE_LICENSE);
                    logger.info("Content written to file.");
                }
                logger.info("Free License has been created:" + freeLicensePath);
            } else {
                logger.error("Free license could not be created.");
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
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

    private void activateDefault(){
        if (getActiveSubs() != null) {
            return;
        }
//        try {
            // Read and decrypt the license
            String freeLicense = LicenseKeyUtility.readFreeLicense();
            LicenseKey licenseKey = LicenseKeyUtility.decrypt(freeLicense);

            // Find the subscription by the decrypted license subId
            Subscription subscription = subscriptionRepository.findBySubId(licenseKey.getSubId()).orElseGet(() -> {
                // If not found, create a new subscription using the activation request
                ActivationRequest ar = activationRequestService.readFreeAR()
                        .orElseThrow(() -> new RuntimeException("Free Activation Request not found!"));
                return convertToSub(freeLicense, ar);
            });
            subscription.setActive(true);
            subscriptionRepository.save(subscription);
//        } catch (IOException e) {
//            throw new RuntimeException("Failed to activate the default subscription due to an I/O error", e);
//        }
    }
}

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.constant.SubscriptionConstant;
import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.SubscriptionRepository;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import com.becon.opencelium.backend.execution.socket.WebSocketNotificationQueue;
import com.becon.opencelium.backend.quartz.DeactivateExpiredSubscriptionJob;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler;
import com.becon.opencelium.backend.quartz.ResetLimitsJob;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.subs.SubsDTO;
import com.becon.opencelium.backend.subscription.dto.ExtraOpsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.subscription.utility.MonthPeriod;
import com.becon.opencelium.backend.utility.MachineUtility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import jakarta.transaction.Transactional;
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
import java.time.*;
import java.util.*;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final Scheduler scheduler;
    private final QuartzJobScheduler quartzJobScheduler;
    private final OperationUsageHistoryService operationUsageHistoryService;
    private final OperationUsageHistoryDetailService operationUsageHistoryDetailService;
    private final ActivationRequestService activationRequestService;
    private final ExtraOpsService extraOpsService;
    private final WebSocketNotificationQueue notificationQueue;
    private final Logger logger = LoggerFactory.getLogger(SubscriptionServiceImpl.class);



    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   Scheduler scheduler,
                                   @Qualifier("operationUsageHistoryServiceImpl") OperationUsageHistoryService operationUsageHistoryService,
                                   @Qualifier("operationUsageHistoryDetailServiceImp") OperationUsageHistoryDetailService operationUsageHistoryDetailService,
                                   @Qualifier("extraOpsServiceImp") ExtraOpsService extraOpsService,
                                   @Qualifier("activationRequestServiceImp") ActivationRequestService activationRequestService,
                                   WebSocketNotificationQueue notificationQueue) {
        this.subscriptionRepository = subscriptionRepository;
        this.scheduler = scheduler;
        this.quartzJobScheduler = new QuartzJobScheduler(scheduler);
        this.operationUsageHistoryService = operationUsageHistoryService;
        this.operationUsageHistoryDetailService = operationUsageHistoryDetailService;
        this.activationRequestService = activationRequestService;
        this.extraOpsService = extraOpsService;
        this.notificationQueue = notificationQueue;
    }

    @Override
    public LicenseKey decryptLicenseKey(String license) {
        return LicenseKeyUtility.decrypt(license);
    }

    @Override
    public boolean isValid(Subscription sub) {
        if (sub == null) {
            logger.warn("No active subscription found. Please activate a free license or upload your license");
            return false;
        }
        LicenseKey licenseKey = LicenseKeyUtility.decrypt(sub.getLicenseKey());
        boolean isValid = LicenseKeyUtility.verify(licenseKey, sub.getActivationRequest());
        if (!isCurrentUsageIsValid(sub)) {
            logger.warn("Usage number of operation has been changed manually.");
            return false;
        }
        if (licenseKey.getOperationUsage() != 0 && sub.getCurrentUsage() >= licenseKey.getOperationUsage()) {
            if (!hasExtra(sub)) {
                logger.warn("You have reached limit of operation usage: {}", licenseKey.getOperationUsage());
                return false;
            }
            if (!hasExtraUsage(sub.getExtraOpsList())) {
                logger.warn("You have reached limit of Extra Ops usage: {}", licenseKey.getOperationUsage());
                return false;
            }
        }
        return isValid;
    }

    private boolean hasExtraUsage(List<ExtraOps> extraOpsList) {
        return extraOpsList.stream().filter(ops -> ops.getStatus() == ExtraOpsStatus.ACTIVE)
                .anyMatch(ops -> ops.getCurrentOpsUsage() < ops.getTotalOpsUsage());
    }

    private boolean isHmacValid(Subscription sub, String hmac) {
        return HmacUtility.verify(sub.getActivationRequest().getId() + MachineUtility.getStringForHmacEncode(), hmac);
    }

    @Override
    @Transactional
    public void resetMonthlyUsageForLicense(String localSubId) {
        Optional<Subscription> optionalLicense = subscriptionRepository.findById(localSubId);

        if (optionalLicense.isPresent()) {
            Subscription subscription = optionalLicense.get();
            LocalDate currentDate = LocalDate.now();
            LicenseKey licenseKey = LicenseKeyUtility.decrypt(subscription.getLicenseKey());
            LocalDate startDate = Instant.ofEpochMilli(licenseKey.getStartDate())
                    .atZone(ZoneId.of("UTC")).toLocalDate();
            LocalDate endDate = Instant.ofEpochMilli(licenseKey.getEndDate())
                    .atZone(ZoneId.of("UTC")).toLocalDate();

            if (currentDate.isAfter(startDate) && currentDate.isBefore(endDate)) {
                // Reset current_usage
                subscription.setCurrentUsage(0);

                // Update current_usage_hmac
                String newHmac = HmacUtility.encode(subscription.getId() + 0);
                subscription.setCurrentUsageHmac(newHmac);

                // Save updated license
                subscriptionRepository.save(subscription);
            }
        }
    }

    @Override
    public Subscription findByLicenseId(String licenseId) {
        return subscriptionRepository.findByLicenseId(licenseId)
                .orElseThrow(() -> {
                    logger.error("Subscription not found for licenseId: {}", licenseId);
                    return new RuntimeException("SUBSCRIPTION_NOT_FOUND");
                });
    }

    @Override
    public void save(Subscription subscription) {
        deactivateAll();
        subscription.setCurrentUsageHmac(HmacUtility
                .encode(subscription.getId() + subscription.getCurrentUsage()));
        initUsageResetJob(subscription);
        initExpiryJob(subscription);
        subscriptionRepository.save(subscription);
    }

    @Override
    public void update(Subscription subscription) {
        subscriptionRepository.save(subscription);
    }

    @Override
    public Subscription setSubscription(String licenseKey, ActivationRequest newAr) {
        if (newAr.getStatus().equals(ActivReqStatus.EXPIRED)) {
            throw new RuntimeException("Couldn't activate license. Activation request has been expired " +
                    "and license is not valid anymore. Generate new Activation Request.");
        }
        activationRequestService.deactivateAll();
        newAr.setStatus(ActivReqStatus.PROCESSED);
        newAr.setActive(true);
        activationRequestService.save(newAr);
        Subscription subscription = convertToSub(licenseKey, newAr);
        deactivateAll();
        save(subscription);
        return subscription;
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
        subsDTO.setLicenseId(subscription.getLicenseId());
        subsDTO.setCurrentOperationUsage(subscription.getCurrentUsage());

        subsDTO.setDuration(licenseKey.getDuration());
        subsDTO.setType(licenseKey.getType());
        subsDTO.setStartDate(licenseKey.getStartDate());
        subsDTO.setSubId(licenseKey.getSubId());
        subsDTO.setEndDate(licenseKey.getEndDate());
        subsDTO.setTotalOperationUsage(licenseKey.getOperationUsage());
        if(subscription.getExtraOpsList() != null && !subscription.getExtraOpsList().isEmpty()) {
            List<ExtraOpsDTO> extraOpsDTOList = subscription.getExtraOpsList().stream()
                    .map(extraOpsService::toDTO).toList();
            subsDTO.setExtraOps(extraOpsDTOList);
        }
        MonthPeriod period = LicenseKeyUtility.getCurrentMonthPeriod(licenseKey.getStartDate());
        subsDTO.setMonthPeriod(period);
        return subsDTO;
    }

    @Override
    public Subscription getById(String id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found: " + id));
    }

    @Transactional
    @Override
    public void updateUsage(String subId, ConnectionEx connectionEx, long opsUsage, long startTime) {
        Optional<Subscription> subOptional = subscriptionRepository.findAndLockById(subId);
        if (subOptional.isEmpty()) {
            throw new RuntimeException("Subscription not found when updating usage: " + subId);
        }
        Subscription sub = subOptional.get();
        // Try to find existing operation usage history
        OperationUsageHistory operationUsageHistory = operationUsageHistoryService
                .findByConnectionTitle(connectionEx.getConnectionName())
                .map(history -> {
                    // If history exists, increment its total usage
                    operationUsageHistoryService.incrementUsageByConnectionTitle(history.getId(), opsUsage);
                    // Create and add a new OperationUsageHistoryDetail
                    OperationUsageHistoryDetail newDetail = new OperationUsageHistoryDetail();
                    newDetail.setOperationUsage(opsUsage);
                    newDetail.setStartDate(Instant.ofEpochMilli(startTime).atZone(ZoneId.of("UTC")).toLocalDateTime());
                    newDetail.setOperationUsageHistory(history);  // Set the bidirectional relationship
                    operationUsageHistoryDetailService.save(newDetail);
                        // Add the new detail to the existing list
//                    history.getDetails().add(newDetail);
                    return history;
                })
                .orElseGet(() -> {
                    // If no history exists, create a new one
                    return operationUsageHistoryService.createNewEntity(sub, connectionEx.getConnectionName(),
                            opsUsage, startTime, connectionEx.getSource().getInvoker(), connectionEx.getTarget().getInvoker());
                });
        operationUsageHistoryService.save(operationUsageHistory);
        if (!isCurrentUsageIsValid(sub)) {
            throw new RuntimeException("Number of operations has been changed manually.");
        }

        long updatedOperationUsage = sub.getCurrentUsage() + opsUsage;
        LicenseKey licenseKey = LicenseKeyUtility.decrypt(sub.getLicenseKey());
        long totalUsage = licenseKey.getOperationUsage();
        long remain = totalUsage - updatedOperationUsage;

        if (sub.getCurrentUsage() < totalUsage){
            long subOpsUsage = remain <= 0 ? totalUsage : updatedOperationUsage;
            String newHmac = HmacUtility.encode(sub.getId() + subOpsUsage);
            sub.setCurrentUsage(subOpsUsage);
            sub.setCurrentUsageHmac(newHmac);
            update(sub);
        }
        if (remain <= 0) {
            remain = Math.abs(remain);
            extraOpsService.updateExtraOpsForSubscription(sub, remain);
        }

        sendNotification();
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

    private void initUsageResetJob(Subscription subscription) {
        String jobKey = "LicenseUsageResetJob-" + subscription.getId();
        String groupKey = "LicenseJobs";
        String triggerName = "LicenseTrigger-" + subscription.getId();
        String triggerGroup = "LicenseTriggers";
        JobKey jobIdentity = new JobKey(jobKey, groupKey);
        TriggerKey triggerKey = new TriggerKey(triggerName, triggerGroup);

        LicenseKey lk = LicenseKeyUtility.decrypt(subscription.getLicenseKey());
        String cron = generateCronExpression(lk.getStartDate());
        try {
            // Check if the job already exists
            if (scheduler.checkExists(jobIdentity)) {
                // Create a new trigger with the updated schedule
                Trigger newTrigger = TriggerBuilder.newTrigger()
                        .withIdentity(triggerKey)
                        .startAt(Date.from(Instant.ofEpochMilli(lk.getStartDate())))
                        .withSchedule(CronScheduleBuilder.cronSchedule(cron))
                        .endAt(Date.from(Instant.ofEpochMilli(lk.getEndDate())))
                        .build();

                // Reschedule the existing job with the new trigger
                scheduler.rescheduleJob(triggerKey, newTrigger);
            } else {
                // If the job does not exist, create a new one
                JobDetail job = JobBuilder.newJob(ResetLimitsJob.class)
                        .withIdentity(jobKey, groupKey)
                        .usingJobData("localSubId", subscription.getId())
                        .build();

                // Create a new trigger for the job
                Trigger trigger = TriggerBuilder.newTrigger()
                        .withIdentity(triggerName, triggerGroup)
                        .startAt(Date.from(Instant.ofEpochMilli(lk.getStartDate())))
                        .withSchedule(CronScheduleBuilder.cronSchedule(cron))
                        .endAt(Date.from(Instant.ofEpochMilli(lk.getEndDate())))
                        .build();

                // Schedule the new job
                scheduler.scheduleJob(job, trigger);
            }
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deactivateExpiredSubscription(String subId) {
        Optional<Subscription> optional = subscriptionRepository.findById(subId);
        if (optional.isEmpty()) {
            logger.warn("Subscription not found when trying to deactivate expired: {}", subId);
            return;
        }
        Subscription subscription = optional.get();
        LicenseKey licenseKey = LicenseKeyUtility.decrypt(subscription.getLicenseKey());
        if (licenseKey.getEndDate() < System.currentTimeMillis()) {
            subscription.setActive(false);
            subscriptionRepository.save(subscription);
            logger.info("Subscription {} deactivated — license expired at {}", subId,
                    Instant.ofEpochMilli(licenseKey.getEndDate()));
            sendNotification();
        }
    }

    private void initExpiryJob(Subscription subscription) {
        LicenseKey lk = LicenseKeyUtility.decrypt(subscription.getLicenseKey());
        if (lk.getEndDate() == SubscriptionConstant.freeLicenseEndDate) {
            return;
        }
        quartzJobScheduler.scheduleOnce(
                DeactivateExpiredSubscriptionJob.class,
                "LicenseExpiryJob-" + subscription.getId(),
                "LicenseExpiryJobs",
                "localSubId",
                subscription.getId(),
                Date.from(Instant.ofEpochMilli(lk.getEndDate()))
        );
    }

    private void killAllTasks() {
        try {
            for (String group : List.of("LicenseJobs", "LicenseExpiryJobs")) {
                for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(group))) {
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

    /**
     * Generate a cron expression based on the start date (epoch milliseconds).
     * This handles edge cases where the day of the month may exceed the number of days in certain months (e.g., February).
     */
    private String generateCronExpression(long startDateMillis) {
        LocalDateTime startDate = LocalDateTime.ofInstant(Instant.ofEpochMilli(startDateMillis), ZoneId.of("UTC"));
        int dayOfMonth = startDate.getDayOfMonth();

        // Handle edge cases where the day of the month might exceed the max days in the current month
        int currentMonthMaxDays = YearMonth.now().lengthOfMonth();
        if (dayOfMonth > currentMonthMaxDays) {
            logger.warn("Adjusting dayOfMonth {} to the last day of the current month ({} days).", dayOfMonth, currentMonthMaxDays);
            dayOfMonth = currentMonthMaxDays; // Adjust to the last valid day of the current month
        }

        // Generate the cron expression for monthly execution on the given day of the month at midnight
        return String.format("0 0 0 %d * ?", dayOfMonth);
    }

    private boolean hasExtra(Subscription sub) {
        return sub.getExtraOpsList() != null && !sub.getExtraOpsList().isEmpty();
    }

    protected void sendNotification() {
        Subscription subscription = getActiveSubs();
        if (subscription != null) {
            String licenseKeyRaw = subscription.getLicenseKey();
            LicenseKey licenseKey = LicenseKeyUtility.decrypt(licenseKeyRaw);

            SubsDTO subsDTO = toDto(licenseKey, subscription);
            notificationQueue.addMessage(SocketConstant.NOTIFICATION_DESTINATION, subsDTO);
        }
    }
}

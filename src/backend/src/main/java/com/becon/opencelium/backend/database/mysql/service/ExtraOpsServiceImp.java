package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.SecurityConstant;
import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.ExtraOpsRepository;
import com.becon.opencelium.backend.subscription.dto.EncryptedExtraOpsFile;
import com.becon.opencelium.backend.subscription.dto.ExtraOpsDTO;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import com.becon.opencelium.backend.subscription.quartz.ExtraOpsJob;
import com.becon.opencelium.backend.utility.crypto.CryptoUtil;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.quartz.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class ExtraOpsServiceImp implements ExtraOpsService {

    private final SubscriptionService subscriptionService;
    private final ExtraOpsRepository extraOpsRepository;
    private final Scheduler scheduler;

    public ExtraOpsServiceImp(ExtraOpsRepository extraOpsRepository, Scheduler scheduler,
                              SubscriptionService subscriptionService) {
        this.extraOpsRepository = extraOpsRepository;
        this.scheduler = scheduler;
        this.subscriptionService = subscriptionService;
    }

    @Override
    public EncryptedExtraOpsFile decrypt(String encryptedExtraOpsDTO) {
        try {
            byte[] decryptData = CryptoUtil.decrypt(encryptedExtraOpsDTO, SecurityConstant.PUBLIC_KEY);
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(decryptData, EncryptedExtraOpsFile.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void save(ExtraOps extraOps) {
        if (!HmacUtility.verify(Long.toString(extraOps.getCurrentOpsUsage()), extraOps.getCurrentOpsUsageHmac())) {
            throw new RuntimeException("Current usage was changed manually in Extra Ops");
        }
        if (!HmacUtility.verify(Long.toString(extraOps.getTotalOpsUsage()), extraOps.getCurrentOpsUsageHmac())) {
            throw new RuntimeException("Total usage was changed manually in Extra Ops");
        }
        // If Active Extra Ops not found then activate current.
        if (!extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)) {
            extraOps.setStatus(ExtraOpsStatus.ACTIVE);
        }
        extraOpsRepository.save(extraOps);
        schedulerExpireDateForExtraOps(extraOps.getId(), extraOps.getEndDate());
    }

    @Override
    public void delete(Long id) {
        extraOpsRepository.deleteById(id);
    }

    @Override
    public void deleteList(List<Long> ids) {
        extraOpsRepository.deleteAllById(ids);
    }

    @Override
    public Optional<ExtraOps> findById(long extraOpsId) {
        return extraOpsRepository.findById(extraOpsId);
    }

    @Override
    public ExtraOpsDTO toDTO(ExtraOps extraOps) {
        ExtraOpsDTO extraOpsDTO = new ExtraOpsDTO();
        extraOpsDTO.setId(extraOps.getId());
        extraOpsDTO.setTotalOpsUsage(extraOps.getTotalOpsUsage());
        extraOpsDTO.setCurrentOpsUsage(extraOps.getCurrentOpsUsage());
        extraOpsDTO.setEndDate(convertToUnixMillis(extraOps.getEndDate()));
        extraOpsDTO.setActivationDate(convertToUnixMillis(extraOps.getEndDate()));
        extraOpsDTO.setGeneratedAt(extraOps.getGeneratedAt());
        return extraOpsDTO;
    }

    @Override
    public ExtraOps toEntityFromEncryption(EncryptedExtraOpsFile encryptedExtraOpsFile) {
        long currentInMillis = System.currentTimeMillis();
        LocalDateTime startDate = Instant.ofEpochMilli(currentInMillis)
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        LocalDateTime endDate = getLastDayOfMonthFromCurrentTime(currentInMillis);

        String hmacTotal = constructHmac(encryptedExtraOpsFile, encryptedExtraOpsFile.getTotalOpsUsage());
        long currentUsage = 0;
        String hmacCurrent = constructHmac(encryptedExtraOpsFile, currentUsage);

        ExtraOps extraOps = new ExtraOps();
        extraOps.setEndDate(endDate);
        extraOps.setStartDate(startDate);
        extraOps.setTotalOpsUsage(encryptedExtraOpsFile.getTotalOpsUsage());
        extraOps.setTotalOpsUsageHmac(hmacTotal);
        extraOps.setCurrentOpsUsage(currentUsage); // 0 because encrypted extra op file doesn't contain current usage.
        extraOps.setCurrentOpsUsageHmac(hmacCurrent);
        extraOps.setStatus(ExtraOpsStatus.PENDING);
        extraOps.setGeneratedAt(encryptedExtraOpsFile.getGeneratedAt());
        return extraOps;
    }

    @Override
    public void update(ExtraOps extraOps) {

    }

    @Override
    public void updateExtraOpsForSubscription(Subscription sub, long opsUsage) {
        while (opsUsage > 0) {
            // 1. Find an extraOps: try to get an ACTIVE one first, otherwise the earliest PENDING one
            Optional<ExtraOps> extraOpsOptional = sub.getExtraOpsList().stream()
                    .filter(e -> e.getStatus() == ExtraOpsStatus.ACTIVE)
                    .findFirst();

            if (extraOpsOptional.isEmpty()) {
                extraOpsOptional = sub.getExtraOpsList().stream()
                        .filter(e -> e.getStatus() == ExtraOpsStatus.PENDING)
                        .min(Comparator.comparing(ExtraOps::getCreatedAt));
            }

            if (extraOpsOptional.isEmpty()) {
                throw new IllegalStateException("No available ExtraOps found for subscription: " + sub.getId());
            }

            ExtraOps extraOps = extraOpsOptional.get();

            // 2. Validate currentOpsUsage using HMAC to ensure data integrity.
            String expectedHmac = constructHmac(extraOps);
            if (!expectedHmac.equals(extraOps.getCurrentOpsUsageHmac())) {
                throw new IllegalStateException("HMAC validation failed for ExtraOps id: " + extraOps.getId());
            }

            // 3. Calculate the available operations for this extraOps.
            long availableOps = extraOps.getTotalOpsUsage() - extraOps.getCurrentOpsUsage();

            if (opsUsage >= availableOps) {
                // If remaining opsUsage can fully consume this extraOps:
                extraOps.setCurrentOpsUsage(extraOps.getTotalOpsUsage());
                extraOps.setCurrentOpsUsageHmac(constructHmac(extraOps));
                extraOps.setStatus(ExtraOpsStatus.CONSUMED);
                // Deduct the amount consumed from opsUsage.
                opsUsage -= availableOps;
            } else {
                // If remaining opsUsage is not enough to consume the extraOps fully:
                extraOps.setCurrentOpsUsage(extraOps.getCurrentOpsUsage() + opsUsage);
                extraOps.setCurrentOpsUsageHmac(constructHmac(extraOps));
                // If this extraOps was PENDING, mark it as ACTIVE now.
                if (extraOps.getStatus() == ExtraOpsStatus.PENDING) {
                    extraOps.setStatus(ExtraOpsStatus.ACTIVE);
                }
                // All operations have been applied.
                opsUsage = 0;
            }
            // 4. Persist the updated extraOps record.
            save(extraOps);
        }
    }

    @Override
    public String constructHmac(ExtraOps extraOps) {
        return HmacUtility.encode(
                extraOps.getSubscription().getLicenseId() +
                     extraOps.getGeneratedAt() +
                     extraOps.getCurrentOpsUsage());
    }

    @Override
    public String constructHmac(EncryptedExtraOpsFile encryptExtraOps, long usage) {
        return HmacUtility.encode(
                encryptExtraOps.getLicenseId() +
                     encryptExtraOps.getGeneratedAt() +
                     usage);
    }

    private LocalDateTime getLastDayOfMonthFromCurrentTime(long millis) {
        // Convert the millisecond timestamp to LocalDateTime using the system default time zone
        LocalDateTime dateTime = Instant.ofEpochMilli(millis)
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();

        // Adjust the date portion to the last day of the month
        LocalDate lastDay = dateTime.toLocalDate().with(TemporalAdjusters.lastDayOfMonth());

        // Combine the adjusted date with the original time component
        return LocalDateTime.of(lastDay, dateTime.toLocalTime());
    }

    private void schedulerExpireDateForExtraOps(long extraOpsId, LocalDateTime endDate) {
        try {
            Date triggerDate = Date.from(endDate.atZone(ZoneId.systemDefault()).toInstant());
            String jobKey = "ExtraOpsJob-" + extraOpsId;
            String groupKey = "ExtraOpsJobs";
            // Define a job and tie it to our ExampleJob class.
            JobDetail job = JobBuilder.newJob(ExtraOpsJob.class)
                    .withIdentity(jobKey, groupKey)
                    .usingJobData("extraOpsId", extraOpsId)
                    .build();

            // Create a trigger that fires once at the specified date and time.
            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity("ExtraOpsJobTrigger" + extraOpsId, "ExtraOpsJobTriggers")
                    .startAt(triggerDate)
                    .withSchedule(SimpleScheduleBuilder.simpleSchedule())
                    .build();

            // Schedule the job using the trigger.
            scheduler.scheduleJob(job, trigger);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Converts a LocalDateTime to Unix milliseconds using the system's default time zone.
     *
     * @param localDateTime the LocalDateTime to convert.
     * @return the Unix time in milliseconds.
     */
    private long convertToUnixMillis(LocalDateTime localDateTime) {
        return localDateTime.atZone(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
    }
}

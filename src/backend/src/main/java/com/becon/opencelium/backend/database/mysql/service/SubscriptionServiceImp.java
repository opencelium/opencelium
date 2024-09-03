package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.SubscriptionRepository;
import com.becon.opencelium.backend.license.LicenseKey;
import com.becon.opencelium.backend.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.utility.crypto.AESUtility;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionServiceImp implements SubscriptionService {
    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionServiceImp(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    public boolean verifyLicenseKey(String licenseKey) {
        return LicenseKeyUtility.verify(licenseKey);
    }

    @Override
    public LicenseKey decryptLicenseKey(String license) {
        return (LicenseKey) AESUtility.decrypt(license, LicenseKey.class);
    }

    @Override
    public boolean isValid(Subscription s) {
        LicenseKey licenseKey = (LicenseKey) AESUtility.decrypt(s.getLicenseKey(), LicenseKey.class);
        if (licenseKey == null || licenseKey.getEndDate().isBefore(LocalDateTime.now()) || licenseKey.getStartDate().isAfter(LocalDateTime.now())) {
            return false;
        }
        return s.generateHmac().equals(s.getCurrentUsageHmac());
    }

    @Override
    public void save(Subscription subscription) {
        subscription.generateAndSetHmac();
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
        subscription.setCreatedAt(LocalDateTime.now());
        subscription.setStartDate(licenseKey.getStartDate());
        subscription.setCurrentUsage(0L);
        subscription.setActive(true);
        subscription.generateAndSetHmac();
        return subscription;
    }

    @Override
    public void deactivateAll() {
        subscriptionRepository.deactivateAll();
    }

    @Override
    public Subscription getActiveSubs() {
        return subscriptionRepository.findActiveSubs().orElse(null);
    }

    @Scheduled(cron = "@monthly")
    private void restartLimitsMonthly() {
        //todo need to be changed
        List<Subscription> all = subscriptionRepository.findAll();
        for (Subscription s : all) {
            s.setCurrentUsage(0L);
            s.generateAndSetHmac();
            subscriptionRepository.save(s);
        }
    }
}

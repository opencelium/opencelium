package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.SubscriptionRepository;
import com.becon.opencelium.backend.resource.subs.SubsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

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
        subscription.setCurrentUsageHmac(HmacUtility.generateHmac(subscription.getId().toString(), Subscription.class));
        return subscription;
    }

    @Override
    public void deactivateAll() {

    }

    @Override
    public Subscription getActiveSubs() {
        return null;
    }

    @Override
    public SubsDTO toDto(LicenseKey licenseKey, Subscription subscription) {
        return null;
    }

    @Override
    public Subscription getById(String id) {
        return null;
    }
}

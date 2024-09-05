package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.resource.subs.SubsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;

public interface SubscriptionService {
    boolean verifyLicenseKey(String licenseKey);
    LicenseKey decryptLicenseKey(String license);
    boolean isValid(Subscription subscription);
    void save(Subscription subscription);
    boolean exists(String subId);
    Subscription buildFromLicenseKey(LicenseKey licenseKey);
    void deactivateAll();
    Subscription getActiveSubs();
    SubsDTO toDto(LicenseKey licenseKey, Subscription subscription);
    Subscription getById(String id);
}

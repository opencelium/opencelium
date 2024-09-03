package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.license.LicenseKey;

public interface SubscriptionService {
    boolean verifyLicenseKey(String licenseKey);
    LicenseKey decryptLicenseKey(String license);
    boolean isValid(Subscription subscription);
    void save(Subscription subscription);
    boolean exists(String subId);
    Subscription buildFromLicenseKey(LicenseKey licenseKey);
    void deactivateAll();
    Subscription getActiveSubs();
}

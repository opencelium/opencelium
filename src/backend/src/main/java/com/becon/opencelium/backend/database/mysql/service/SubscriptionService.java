package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.resource.subs.SubsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;

public interface SubscriptionService {
    LicenseKey decryptLicenseKey(String license);
    boolean isValid(Subscription subscription);
    void save(Subscription subscription);
    boolean exists(String subId);
    Subscription convertToSub(String licenseKey);

    Subscription buildFromLicenseKey(LicenseKey licenseKey, ActivationRequest ar);

    void deactivateAll();
    Subscription getActiveSubs();
    SubsDTO toDto(LicenseKey licenseKey, Subscription subscription);
    Subscription getById(String id);
    void updateUsage(Subscription activeSub, long connectionId, long requestSize);
}

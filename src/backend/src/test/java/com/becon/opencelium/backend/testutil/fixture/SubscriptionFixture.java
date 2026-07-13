package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;

import java.util.UUID;

/**
 * Object mother for {@link Subscription} test data.
 */
public final class SubscriptionFixture {

    private SubscriptionFixture() {}

    public static Subscription aSubscription(
            String subId,
            String licenseId,
            boolean active,
            ActivationRequest activationRequest
    ) {
        Subscription subscription = new Subscription();

        subscription.setId(UUID.randomUUID().toString());
        subscription.setSubId(subId);
        subscription.setLicenseId(licenseId);
        subscription.setLicenseKey("license-key-" + licenseId);
        subscription.setCurrentUsage(0);
        subscription.setCurrentUsageHmac("usage-hmac-" + subId);
        subscription.setActive(active);
        subscription.setActivationRequest(activationRequest);

        return subscription;
    }
}

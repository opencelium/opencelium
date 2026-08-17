package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;

import java.time.LocalDateTime;

/**
 * Object mother for {@link ExtraOps} test data.
 */
public final class ExtraOpsFixture {
    private ExtraOpsFixture() {
    }

    /**
     * Creates a transient extra-operations record attached to the supplied subscription.
     */
    public static ExtraOps anExtraOps(Subscription subscription, ExtraOpsStatus status, long generatedAt) {
        ExtraOps extraOps = new ExtraOps();

        extraOps.setSubscription(subscription);
        extraOps.setStartDate(LocalDateTime.of(2026, 8, 1, 0, 0));
        extraOps.setEndDate(LocalDateTime.of(2026, 8, 31, 23, 59, 59));
        extraOps.setStatus(status);
        extraOps.setCurrentOpsUsage(0L);
        extraOps.setCurrentOpsUsageHmac("current-ops-usage-hmac");
        extraOps.setTotalOpsUsage(1_000L);
        extraOps.setTotalOpsUsageHmac("total-ops-usage-hmac");
        extraOps.setGeneratedAt(generatedAt);

        return extraOps;
    }
}
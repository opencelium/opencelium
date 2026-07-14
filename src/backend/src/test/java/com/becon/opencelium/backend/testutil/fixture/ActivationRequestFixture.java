package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.enums.ActivReqStatus;

import java.util.UUID;

/**
 * Object mother for {@link ActivationRequest} test data.
 */
public final class ActivationRequestFixture {
    private ActivationRequestFixture() {
    }

    /**
     * Activation request in the initial state generated locally before
     * license activation. Mirrors the default bundled activation request.
     */
    public static ActivationRequest aPendingActivationRequest() {
        return anActivationRequest(ActivReqStatus.PENDING, false);
    }

    /**
     * Activation request that can no longer be redeemed for license activation.
     * Used to pin expiry-related validation branches.
     */
    public static ActivationRequest aExpiredActivationRequest() {
        return anActivationRequest(ActivReqStatus.EXPIRED, false);
    }

    /**
     * Activation request that was successfully redeemed for a license and
     * activated on the current machine.
     */
    public static ActivationRequest aProcessedActivationRequest() {
        return anActivationRequest(ActivReqStatus.PROCESSED, true);
    }

    /**
     * Activation request with given status and state.
     */
    public static ActivationRequest anActivationRequest(ActivReqStatus status, boolean active) {
        ActivationRequest request = new ActivationRequest();

        request.setId(UUID.randomUUID().toString());
        request.setHmac("Aymga2vvpFZQm0JzWqV8K7zP0K0mTQ5l0V7i4S3n8XQ=");
        request.setStatus(status);
        request.setActive(active);
        request.setTtl(3600);

        return request;
    }
}

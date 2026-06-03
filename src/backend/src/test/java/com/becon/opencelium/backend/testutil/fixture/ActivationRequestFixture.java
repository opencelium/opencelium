package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.enums.ActivReqStatus;

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
        ActivationRequest request = new ActivationRequest();

        request.setId("eff042a1-b9db-43b3-855d-b62d712ce4c9");
        request.setHmac("Aymga2vvpFZQm0JzWqV8K7zP0K0mTQ5l0V7i4S3n8XQ=");
        request.setStatus(ActivReqStatus.PENDING);
        request.setActive(false);
        request.setTtl(3600);

        return request;
    }

    /**
     * Activation request that can no longer be redeemed for license activation.
     * Used to pin expiry-related validation branches.
     */
    public static ActivationRequest aExpiredActivationRequest() {
        ActivationRequest request = new ActivationRequest();

        request.setId("eff042a1-b9db-43b3-855d-b62d712ce4c9");
        request.setHmac("Aymga2vvpFZQm0JzWqV8K7zP0K0mTQ5l0V7i4S3n8XQ=");
        request.setStatus(ActivReqStatus.EXPIRED);
        request.setActive(false);
        request.setTtl(3600);

        return request;
    }

    /**
     * Activation request that was successfully redeemed for a license and
     * activated on the current machine.
     */
    public static ActivationRequest aProcessedActivationRequest() {
        ActivationRequest request = new ActivationRequest();

        request.setId("eff042a1-b9db-43b3-855d-b62d712ce4c9");
        request.setHmac("Aymga2vvpFZQm0JzWqV8K7zP0K0mTQ5l0V7i4S3n8XQ=");
        request.setStatus(ActivReqStatus.PROCESSED);
        request.setActive(true);
        request.setTtl(3600);

        return request;
    }
}

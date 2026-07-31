package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.resource.schedule.RunningJob;

/**
 * Object mother for {@link RunningJob} test data.
 */
public final class RunningJobFixture {
    private RunningJobFixture() {
    }

    public static RunningJob aRunningJob(long connectionId, int schedulerId, long execId) {
        ActivationRequest request = new ActivationRequest();

        return new RunningJob(connectionId, schedulerId, execId);
    }
}

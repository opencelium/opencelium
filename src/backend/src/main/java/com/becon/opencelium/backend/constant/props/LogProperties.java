package com.becon.opencelium.backend.constant.props;

import com.becon.opencelium.backend.constant.LogConstant;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "opencelium.log")
public class LogProperties {

    private static final String LOCATION = LogConstant.LOG_LOCATION;

    @Valid
    @NotNull
    private Retention retention = new Retention();

    public String getLocation() {
        return LOCATION;
    }

    public Retention getRetention() {
        return retention;
    }

    public void setRetention(Retention retention) {
        this.retention = retention;
    }

    public static class Retention {

        @Valid
        @NotNull
        private PerConnection perConnection = new PerConnection();

        @Valid
        @NotNull
        private TestConnection testConnection = new TestConnection();

        public PerConnection getPerConnection() {
            return perConnection;
        }

        public void setPerConnection(PerConnection perConnection) {
            this.perConnection = perConnection;
        }

        public TestConnection getTestConnection() {
            return testConnection;
        }

        public void setTestConnection(TestConnection testConnection) {
            this.testConnection = testConnection;
        }
    }

    public static class PerConnection {

        @Min(0)
        private int success = 2;

        @Min(0)
        private int fail = 3;

        public int getSuccess() {
            return success;
        }

        public void setSuccess(int success) {
            this.success = success;
        }

        public int getFail() {
            return fail;
        }

        public void setFail(int fail) {
            this.fail = fail;
        }
    }

    public static class TestConnection {

        private boolean enabled = true;

        @Min(0)
        private long maxAge = 240_000L; // 4 minutes

        @Min(0)
        private long sweepInterval = 600_000L; // 10 minutes

        @Min(0)
        private long initialDelay = 60_000L; // 1 minute

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public long getMaxAge() {
            return maxAge;
        }

        public void setMaxAge(long maxAge) {
            this.maxAge = maxAge;
        }

        public long getSweepInterval() {
            return sweepInterval;
        }

        public void setSweepInterval(long sweepInterval) {
            this.sweepInterval = sweepInterval;
        }

        public long getInitialDelay() {
            return initialDelay;
        }

        public void setInitialDelay(long initialDelay) {
            this.initialDelay = initialDelay;
        }
    }
}

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

        @NotNull
        private Duration maxAge = Duration.ofMinutes(10);

        @NotNull
        private Duration sweepInterval = Duration.ofMinutes(10);

        @NotNull
        private Duration initialDelay = Duration.ofMinutes(1);

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public Duration getMaxAge() {
            return maxAge;
        }

        public void setMaxAge(Duration maxAge) {
            this.maxAge = maxAge;
        }

        public Duration getSweepInterval() {
            return sweepInterval;
        }

        public void setSweepInterval(Duration sweepInterval) {
            this.sweepInterval = sweepInterval;
        }

        public Duration getInitialDelay() {
            return initialDelay;
        }

        public void setInitialDelay(Duration initialDelay) {
            this.initialDelay = initialDelay;
        }
    }
}

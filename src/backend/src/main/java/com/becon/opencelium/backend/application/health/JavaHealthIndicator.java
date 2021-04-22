package com.becon.opencelium.backend.application.health;

import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;

public class JavaHealthIndicator extends AbstractHealthIndicator {

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        builder.up()
                .withDetail("version", System.getProperty("java.version"))
                .withDetail("vendor", System.getProperty("java.vm.vendor"));
    }
}

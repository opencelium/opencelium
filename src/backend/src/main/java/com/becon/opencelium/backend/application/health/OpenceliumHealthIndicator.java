package com.becon.opencelium.backend.application.health;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class OpenceliumHealthIndicator extends AbstractHealthIndicator {

    @Autowired
    private Environment env;

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        builder.up()
                .withDetail("version", Objects.requireNonNull(env.getProperty("opencelium.version")));
    }
}

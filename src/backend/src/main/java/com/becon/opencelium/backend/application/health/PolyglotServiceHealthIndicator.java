package com.becon.opencelium.backend.application.health;

import com.becon.opencelium.backend.scriptengine.external.polyglotservice.PolyglotServiceGRPCClient;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

@Component("PolyglotService")
public class PolyglotServiceHealthIndicator extends AbstractHealthIndicator {

    private final PolyglotServiceGRPCClient polyglotServiceGRPCClient;

    public PolyglotServiceHealthIndicator(PolyglotServiceGRPCClient polyglotServiceGRPCClient) {
        this.polyglotServiceGRPCClient = polyglotServiceGRPCClient;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        if (polyglotServiceGRPCClient.isUp()) {
            builder.withDetail("name", "Polyglot Service");
            builder.up();
        } else {
            builder.withDetail("name", "Polyglot Service")
                    .down();
        }
    }
}

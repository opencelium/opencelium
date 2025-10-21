package com.becon.opencelium.backend.application.health;

import com.becon.opencelium.backend.scriptengine.external.polyglotservice.PolyglotServiceGRPCClient;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Component;

@Component("polyglot")
public class PolyglotHealthIndicator extends AbstractHealthIndicator {

    private final PolyglotServiceGRPCClient polyglotServiceGRPCClient;

    public PolyglotHealthIndicator(PolyglotServiceGRPCClient polyglotServiceGRPCClient) {
        this.polyglotServiceGRPCClient = polyglotServiceGRPCClient;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        builder.withDetail("name", "Polyglot");

        try {
            if (polyglotServiceGRPCClient.isUp()) {
                builder.up();
            } else {
                builder.down()
                        .withDetail("error", "Couldn't establish a connection to Polyglot service. Check if it is running.");
            }
        } catch (Exception e) {
            builder.down()
                    .withDetail("error", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        }
    }
}

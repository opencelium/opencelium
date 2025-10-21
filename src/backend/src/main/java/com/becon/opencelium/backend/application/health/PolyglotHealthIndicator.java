package com.becon.opencelium.backend.application.health;

import com.becon.opencelium.backend.scriptengine.external.polyglotservice.PolyglotServiceGRPCClient;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

@Component("polyglot")
public class PolyglotHealthIndicator extends AbstractHealthIndicator {

    private final PolyglotServiceGRPCClient polyglotServiceGRPCClient;

    public PolyglotHealthIndicator(PolyglotServiceGRPCClient polyglotServiceGRPCClient) {
        this.polyglotServiceGRPCClient = polyglotServiceGRPCClient;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try {
            polyglotServiceGRPCClient.isUp();
            builder.withDetail("name", "Polyglot");
            builder.up();
        } catch (Exception e) {
            builder.withDetail("error", e.getMessage())
                    .down();
        }
    }
}

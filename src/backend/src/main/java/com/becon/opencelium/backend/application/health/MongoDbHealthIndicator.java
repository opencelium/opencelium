package com.becon.opencelium.backend.application.health;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

@Component("mongoDB")
public class MongoDbHealthIndicator extends AbstractHealthIndicator {
    private final MongoClient mongoClient;

    public MongoDbHealthIndicator(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {

        try {
            mongoClient.listDatabaseNames(); //checking connectivity to db

            MongoDatabase database = mongoClient.getDatabase("admin");
            Document buildInfo = database.runCommand(new Document("buildInfo", 1));
            String mongoVersion = buildInfo.getString("version");

            builder.withDetail("name", "MongoDB");
            builder.up()
                    .withDetail("version", mongoVersion);
        } catch (Exception e) {
            builder.down()
                    .withDetail("error", e.getMessage());
        }
    }
}

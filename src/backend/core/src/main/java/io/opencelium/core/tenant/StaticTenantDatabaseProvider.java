package io.opencelium.core.tenant;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import io.opencelium.common.tenant.TenantId;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Self-hosted routing: one customer, one MongoDB, configured at startup.
 */
@Component
@ConditionalOnProperty(prefix = "opencelium.tenancy", name = "mode", havingValue = "self-hosted",
        matchIfMissing = true)
public class StaticTenantDatabaseProvider implements TenantDatabaseProvider {

    static final String URI_PROPERTY = "spring.mongodb.uri";
    private static final String DEFAULT_DATABASE = "opencelium";

    private final MongoClient mongoClient;
    private final String databaseName;

    public StaticTenantDatabaseProvider(MongoClient mongoClient, Environment environment) {
        this.mongoClient = mongoClient;
        this.databaseName = databaseNameFrom(environment);
    }

    @Override
    public MongoDatabase databaseFor(TenantId tenant) {
        return mongoClient.getDatabase(databaseName);
    }

    public String databaseName() {
        return databaseName;
    }

    private static String databaseNameFrom(Environment environment) {
        String uri = environment.getProperty(URI_PROPERTY);
        if (uri == null || uri.isBlank()) {
            // DatabaseStartupCheck reports this first, with the fuller explanation.
            throw new IllegalStateException(URI_PROPERTY + " must be set in self-hosted mode");
        }
        String database = new ConnectionString(uri).getDatabase();
        return database != null ? database : DEFAULT_DATABASE;
    }
}

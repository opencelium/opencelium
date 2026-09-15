package io.opencelium.core.config.startup;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import io.opencelium.core.config.TenancyProperties;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class DatabaseStartupCheck implements InitializingBean {

    static final String URI_PROPERTY = "spring.mongodb.uri";

    private static final String ADMIN_DATABASE = "admin";
    private static final Logger log = LoggerFactory.getLogger(DatabaseStartupCheck.class);

    private final TenancyProperties tenancy;
    private final Environment environment;
    private final ObjectProvider<MongoClient> mongoClient;

    public DatabaseStartupCheck(TenancyProperties tenancy, Environment environment,
                                ObjectProvider<MongoClient> mongoClient) {
        this.tenancy = tenancy;
        this.environment = environment;
        this.mongoClient = mongoClient;
    }

    @Override
    public void afterPropertiesSet() {
        if (tenancy.isCloud()) {
            return;
        }
        String uri = environment.getProperty(URI_PROPERTY);
        if (uri == null || uri.isBlank()) {
            throw new IllegalStateException(URI_PROPERTY + " must be set when opencelium.tenancy.mode is self-hosted: "
                    + "point it at the customer's MongoDB, or the application would silently use "
                    + "mongodb://localhost:27017");
        }
        if (tenancy.selfHosted().verifyConnectionOnStartup()) {
            verifyConnection(uri);
        }
    }

    private void verifyConnection(String uri) {
        ConnectionString connectionString = parse(uri);
        String hosts = String.join(",", connectionString.getHosts());
        String database = connectionString.getDatabase() != null ? connectionString.getDatabase() : ADMIN_DATABASE;
        try {
            mongoClient.getObject().getDatabase(database).runCommand(new Document("ping", 1));
            log.info("MongoDB reachable at {}", hosts);
        } catch (RuntimeException ex) {
            // The URI carries the password, so report only the hosts.
            throw new IllegalStateException("Cannot reach MongoDB at " + hosts
                    + ". Check " + URI_PROPERTY + ", the database's availability, and the credentials"
                    + " (set opencelium.tenancy.self-hosted.verify-connection-on-startup=false to start anyway)", ex);
        }
    }

    private static ConnectionString parse(String uri) {
        try {
            return new ConnectionString(uri);
        } catch (RuntimeException ex) {
            throw new IllegalStateException(URI_PROPERTY + " is not a valid MongoDB connection string", ex);
        }
    }
}

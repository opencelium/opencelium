package com.becon.opencelium.backend.application.health;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.internal.DriverFactory;
import org.neo4j.driver.internal.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Component
public class Neo4jHealthIndicator extends AbstractHealthIndicator {

    static final String CYPHER = "match (n) return count(n) as nodes";

    @Autowired
    private Driver driver;

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        Session session = this.driver.session();
        getProductVersion(builder, session);

        extractResult(session, builder);


    }

    private void extractResult(Session session, Health.Builder builder) throws Exception {
        Result result = session.run(CYPHER, Collections.emptyMap());
        builder.up().withDetail("nodes", result.next().get("nodes"));
    }

    private void getProductVersion(Health.Builder builder, Session session) {
        String version = "";
        Result result = session
                .run("call dbms.components() yield versions unwind versions as version return version;",  new HashMap<String, Object>());
        while (result.hasNext()) {
            Map<String, Object> map = result.next().asMap();
            if (map.containsKey("version")) {
                version = (String) map.get("version");
                break;
            }
        }
        builder.withDetail("version", version);
    }
}

package com.becon.opencelium.backend.application.health;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
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
        String version = getProductVersion();
        Integer nodesCount = extractResult();
        builder.up().withDetail("version", version).up()
                .withDetail("nodes", nodesCount);
    }

    private Integer extractResult() throws Exception {
        Result result = driver.session().run(CYPHER, Collections.emptyMap());
        return result.single().get("nodes").asInt();
    }

    private String getProductVersion() {
        Result result = driver.session()
                .run("call dbms.components() yield versions unwind versions as version return version;",  new HashMap<String, Object>());
        return result.single().get(0).asString();
    }
}

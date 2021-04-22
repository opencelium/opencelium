package com.becon.opencelium.backend.application.health;

import org.neo4j.ogm.model.Result;
import org.neo4j.ogm.session.Session;
import org.neo4j.ogm.session.SessionFactory;
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
    private SessionFactory sessionFactory;

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        getProductVersion(builder);
        Session session = this.sessionFactory.openSession();
        extractResult(session, builder);


    }

    private void extractResult(Session session, Health.Builder builder) throws Exception {
        Result result = session.query(CYPHER, Collections.emptyMap());
        builder.up().withDetail("nodes", result.queryResults().iterator().next().get("nodes"));
    }

    private void getProductVersion(Health.Builder builder) {
        String version = "";
        Result result = sessionFactory.openSession()
                .query("call dbms.components() yield versions unwind versions as version return version;",  new HashMap<String, Object>());
        while (result.iterator().hasNext()) {
            Map<String, Object> map = result.iterator().next();
            if (map.containsKey("version")) {
                version = (String) map.get("version");
                break;
            }
        }
        builder.withDetail("version", version);
    }
}

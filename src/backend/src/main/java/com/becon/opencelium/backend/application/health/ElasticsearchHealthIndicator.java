package com.becon.opencelium.backend.application.health;

import org.apache.http.HttpStatus;
import org.apache.http.StatusLine;
import org.elasticsearch.action.admin.cluster.node.info.NodeInfo;
import org.elasticsearch.action.admin.cluster.node.info.NodesInfoResponse;
import org.elasticsearch.client.Client;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class ElasticsearchHealthIndicator extends AbstractHealthIndicator {

    private static final String RED_STATUS = "red";

    @Autowired
    private RestClient restClient;

    private JsonParser jsonParser = JsonParserFactory.getJsonParser();

    @Autowired
    private Client client;

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        builder.withDetail("version", getProductVersion());
        Response response = this.restClient.performRequest(new Request("GET", "/_cluster/health/"));
        StatusLine statusLine = response.getStatusLine();
        if (statusLine.getStatusCode() != HttpStatus.SC_OK) {
            builder.down();
            builder.withDetail("statusCode", statusLine.getStatusCode());
            builder.withDetail("reasonPhrase", statusLine.getReasonPhrase());
            return;
        }
        try (InputStream inputStream = response.getEntity().getContent()) {
            doHealthCheck(builder, StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8));
        }
    }

    private void doHealthCheck(Health.Builder builder, String json) {
        Map<String, Object> response = this.jsonParser.parseMap(json);
        String status = (String) response.get("status");
        if (RED_STATUS.equals(status)) {
            builder.outOfService();
        }
        else {
            builder.up();
        }
        builder.withDetails(response);
    }

    private String getProductVersion(){
        try {
            NodesInfoResponse nodesInfoResponse = client.admin().cluster().prepareNodesInfo().all().execute().actionGet();
            NodeInfo nodeInfo = nodesInfoResponse.getNodes().stream().findFirst().orElseThrow(() -> new RuntimeException("Node not found"));
            return nodeInfo.getVersion().toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "Service is down. Unable to detect version.";
        }
    }
}

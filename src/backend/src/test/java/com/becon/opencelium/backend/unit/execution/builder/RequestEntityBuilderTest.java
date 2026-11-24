package com.becon.opencelium.backend.unit.execution.builder;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.execution.ExecutionManagerImpl;
import com.becon.opencelium.backend.execution.builder.RequestEntityBuilder;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.RequestEntity;

/**
 * Unit tests for how {@link RequestEntityBuilder} casts a global variable to what its place in
 * the request needs: text in the URL and in a header, the JSON type in a body field.
 *
 * <p>The operation is mapped from a method the way an execution maps it, and references are
 * resolved by a real execution manager over a snapshot, so no reference logic is faked.
 *
 * <p>Run with: ./gradlew test --tests "*.RequestEntityBuilderTest"
 */
@DisplayName("RequestEntityBuilder — unit")
class RequestEntityBuilderTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static final GlobalVariableSnapshot SNAPSHOT = GlobalVariableSnapshot.of(List.of(
            anEntry("idoitUrl", "\"https://cmdb.example.test:8443/base\""),
            anEntry("tenant", "\"acme corp?x=1\""),
            anEntry("tenants", "[\"acme\",\"globex\"]"),
            anEntry("limit", "50"),
            anEntry("meta", "{\"env\":\"prod\",\"tier\":1}"),
            anEntry("empty", "\"\""),
            anEntry("nothing", "null")));

    @Test
    @DisplayName("createRequest — a global list in the query is one value of JSON text, not a repeated parameter")
    void createRequestSendsGlobalListAsJsonTextWhenUsedInQuery() {
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "GET", "https://api.example.test/sync?tenants={{global.tenants}}", Map.of(), null);

        RequestEntity<Object> request = build(operation);

        String query = URLDecoder.decode(request.getUrl().getRawQuery(), StandardCharsets.UTF_8);
        assertThat(query).isEqualTo("tenants=[\"acme\",\"globex\"]");
    }

    @Test
    void createRequestSendsGlobalMapAsJsonTextWhenUsedInHeader() {
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "GET", "https://api.example.test/sync", Map.of("X-Meta", "{{global.meta}}"), null);

        RequestEntity<Object> request = build(operation);

        assertThat(request.getHeaders().get("X-Meta")).containsExactly("{\"env\":\"prod\",\"tier\":1}");
    }

    @Test
    @DisplayName("createRequest — a header that is only a global holding \"\" or null is sent empty, not refused")
    void createRequestSendsEmptyHeaderWhenGlobalIsEmptyOrNull() {
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "GET", "https://api.example.test/sync",
                Map.of("X-Empty", "{{global.empty}}", "X-Nothing", "{{global.nothing}}"), null);

        RequestEntity<Object> request = build(operation);

        assertThat(request.getHeaders().get("X-Empty")).containsExactly("");
        assertThat(request.getHeaders().get("X-Nothing")).containsExactly("");
    }

    @Test
    @DisplayName("createRequest — a body field that is only the reference is sent as an array or a number")
    void createRequestKeepsJsonTypeWhenBodyFieldIsOnlyGlobalReference() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("tenants", "{{global.tenants}}");
        body.put("limit", "{{global.limit}}");
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "POST", "https://api.example.test/sync", Map.of("Content-Type", "application/json"), body);

        RequestEntity<Object> request = build(operation);

        JsonNode sent = JSON.readTree((String) request.getBody());
        assertThat(sent.get("tenants").isArray()).isTrue();
        assertThat(sent.get("tenants").get(1).asText()).isEqualTo("globex");
        assertThat(sent.get("limit").isInt()).isTrue();
        assertThat(sent.get("limit").asInt()).isEqualTo(50);
    }

    @Test
    @DisplayName("createRequest — a global at the start of the endpoint holds URL text and is not encoded as data")
    void createRequestInsertsGlobalUrlAsIsWhenItStartsTheEndpoint() {
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "GET", "{{global.idoitUrl}}/api/objects?limit=5", Map.of(), null);

        RequestEntity<Object> request = build(operation);

        assertThat(request.getUrl()).hasToString("https://cmdb.example.test:8443/base/api/objects?limit=5");
    }

    @Test
    @DisplayName("createRequest — a global inside the path is data: its '?' cannot start a query")
    void createRequestEncodesGlobalValueWhenUsedInsidePath() {
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "GET", "https://api.example.test/tenants/{{global.tenant}}/items", Map.of(), null);

        RequestEntity<Object> request = build(operation);

        assertThat(request.getUrl().getRawPath()).isEqualTo("/tenants/acme%20corp%3Fx=1/items");
        assertThat(request.getUrl().getRawQuery()).isNull();
    }

    @Test
    @DisplayName("createRequest — an escaped token in a body field is sent as the token, without its backslash")
    void createRequestSendsLiteralTokenWhenBodyFieldIsEscaped() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("template", "\\{{global.limit}}");
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "POST", "https://api.example.test/sync", Map.of("Content-Type", "application/json"), body);

        RequestEntity<Object> request = build(operation);

        JsonNode sent = JSON.readTree((String) request.getBody());
        assertThat(sent.get("template").asText()).isEqualTo("{{global.limit}}");
    }

    @Test
    void createRequestSendsLiteralTokenWhenHeaderIsEscaped() {
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "GET", "https://api.example.test/sync", Map.of("X-Template", "\\{{global.limit}}"), null);

        RequestEntity<Object> request = build(operation);

        assertThat(request.getHeaders().get("X-Template")).containsExactly("{{global.limit}}");
    }

    @Test
    @DisplayName("createRequest — an escaped token in the path is typed text: braces encoded, backslash gone")
    void createRequestEncodesLiteralTokenWhenPathHoldsEscapedOne() {
        OperationDTO operation = OperationDTOFixture.anHttpOperation(
                "GET", "https://api.example.test/templates/\\{{global.limit}}/items", Map.of(), null);

        RequestEntity<Object> request = build(operation);

        assertThat(request.getUrl().getRawPath()).isEqualTo("/templates/%7B%7Bglobal.limit%7D%7D/items");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static RequestEntity<Object> build(OperationDTO operation) {
        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(), Map.of(), Map.of(), Map.of(), SNAPSHOT, ReferenceExtractor::new);

        return RequestEntityBuilder.start()
                .forOperation(operation)
                .usingReferences(manager::getValue)
                .createRequest();
    }

    private static GlobalVariableSnapshot.Entry anEntry(String name, String json) {
        try {
            return new GlobalVariableSnapshot.Entry(name, 1, JSON.readTree(json));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(json, e);
        }
    }
}

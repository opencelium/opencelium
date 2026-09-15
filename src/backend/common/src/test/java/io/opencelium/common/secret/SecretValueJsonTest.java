package io.opencelium.common.secret;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class SecretValueJsonTest {

    private static final String CANARY = "canary-8f31c2a7";

    private final ObjectMapper mapper = new ObjectMapper();

    record Connector(String name, SecretValue apiToken) { }

    @Test
    void serialisingASecretWritesAMaskInsteadOfTheValue() throws Exception {
        String json = mapper.writeValueAsString(new Connector("jira", SecretValue.of(CANARY)));

        assertFalse(json.contains(CANARY), "a secret must never reach a response body");
        assertEquals("{\"name\":\"jira\",\"apiToken\":\"***\"}", json);
    }

    @Test
    void deserialisingASecretReadsTheValueBecauseRequestsMayCarryOne() throws Exception {
        Connector connector = mapper.readValue("{\"name\":\"jira\",\"apiToken\":\"" + CANARY + "\"}", Connector.class);

        assertEquals(SecretValue.of(CANARY), connector.apiToken());
    }
}

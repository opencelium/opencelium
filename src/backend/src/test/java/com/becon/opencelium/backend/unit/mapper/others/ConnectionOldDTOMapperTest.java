/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.mapper.others;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.enums.MethodType;
import com.becon.opencelium.backend.mapper.others.ConnectionOldDTOMapper;
import com.becon.opencelium.backend.mapper.others.ConnectionOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.ConnectorOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.EnhancementOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.FieldBindingOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.MethodOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.OperatorOldDTOMapperImpl;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Unit tests for {@link ConnectionOldDTOMapper}, focused on the mutable global variables a
 * method writes (OC-1691).
 *
 * <p>The old form of a workflow is what {@code ConnectionController} reads and returns: the body
 * of {@code POST /connection}, {@code PUT /connection/{id}} and {@code POST
 * /connection/execution/test}, and the answer of {@code GET /connection/{id}}. A method's {@code
 * globalWrites} must pass the mapper both ways, or a save drops the writes and a read hides them.
 *
 * <p>Runs the MapStruct-generated mappers directly, wired by hand with {@link
 * ReflectionTestUtils}, and reads and writes the old form as JSON, as the endpoints do.
 *
 * <p>Run with: ./gradlew test --tests "*.ConnectionOldDTOMapperTest"
 */
class ConnectionOldDTOMapperTest {

    private static final String LAST_SYNC_WRITE = "#ababab.(response).body.$.updatedAt";

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ConnectionOldDTOMapperImpl mapper;

    @BeforeEach
    void setUp() {
        ConnectorOldDTOMapperImpl connectorMapper = new ConnectorOldDTOMapperImpl();
        ReflectionTestUtils.setField(connectorMapper, "methodOldDTOMapper",
                new MethodOldDTOMapperImpl());
        ReflectionTestUtils.setField(connectorMapper, "operatorOldDTOMapper",
                new OperatorOldDTOMapperImpl());
        FieldBindingOldDTOMapperImpl bindingMapper = new FieldBindingOldDTOMapperImpl();
        ReflectionTestUtils.setField(bindingMapper, "enhancementOldDTOMapper",
                new EnhancementOldDTOMapperImpl());
        mapper = new ConnectionOldDTOMapperImpl();
        ReflectionTestUtils.setField(mapper, "connectorOldDTOMapper", connectorMapper);
        ReflectionTestUtils.setField(mapper, "fieldBindingOldDTOMapper", bindingMapper);
    }

    // ---------------------------------------------------------------- toEntity: a save

    @Test
    @DisplayName("toEntity — a saved workflow keeps the mutable variables a method writes")
    void toEntityKeepsGlobalWritesWhenRequestBodyHasThem() throws Exception {
        ConnectionOldDTO body = objectMapper.readValue(aRequestBody(
                "\"globalWrites\": {\"global.lastSync\": \"" + LAST_SYNC_WRITE + "\"},"),
                ConnectionOldDTO.class);

        ConnectionDTO saved = mapper.toEntity(body);

        assertThat(saved.getFromConnector().getMethods().get(0).getGlobalWrites())
                .containsExactly(Map.entry("global.lastSync", LAST_SYNC_WRITE));
    }

    @Test
    @DisplayName("toEntity — a method without writes is saved without writes")
    void toEntityLeavesGlobalWritesNullWhenRequestBodyHasNone() throws Exception {
        ConnectionOldDTO body = objectMapper.readValue(aRequestBody(""), ConnectionOldDTO.class);

        ConnectionDTO saved = mapper.toEntity(body);

        assertThat(saved.getFromConnector().getMethods().get(0).getGlobalWrites()).isNull();
    }

    // ---------------------------------------------------------------- toDTO: a read

    @Test
    @DisplayName("toDTO — a read workflow shows the mutable variables a method writes")
    void toDtoKeepsGlobalWritesWhenMethodWritesMutableVariable() {
        ConnectionDTO stored = aStoredWorkflow(Map.of("global.lastSync", LAST_SYNC_WRITE));

        JsonNode returned = objectMapper.valueToTree(mapper.toDTO(stored));

        assertThat(returned.at("/fromConnector/methods/0/globalWrites/global.lastSync").asText())
                .isEqualTo(LAST_SYNC_WRITE);
    }

    @Test
    @DisplayName("toDTO — a method without writes is returned as before")
    void toDtoLeavesGlobalWritesOutWhenMethodWritesNothing() {
        ConnectionDTO stored = aStoredWorkflow(null);

        JsonNode returned = objectMapper.valueToTree(mapper.toDTO(stored));

        assertThat(returned.at("/fromConnector/methods/0").has("globalWrites")).isFalse();
    }

    // ---------------------------------------------------------------- fixtures

    /** The body of a save with one method; {@code writes} is put into the method as it is. */
    private static String aRequestBody(String writes) {
        return """
                {
                  "title": "sync orders",
                  "fromConnector": {
                    "connectorId": %d,
                    "title": "%s",
                    "methods": [{
                      "color": "#ababab",
                      "index": "0",
                      "name": "get orders",
                      "methodType": "HTTP_REQUEST",
                      %s
                      "request": {"endpoint": "https://shop.example/orders", "method": "GET"}
                    }],
                    "operators": []
                  }
                }
                """.formatted(ConnectionConstants.DEFAULT_CONNECTOR_ID,
                ConnectionConstants.DEFAULT_CONNECTOR_NAME, writes);
    }

    private static ConnectionDTO aStoredWorkflow(Map<String, String> writes) {
        RequestDTO request = new RequestDTO();
        request.setEndpoint("https://shop.example/orders");
        request.setMethod("GET");
        MethodDTO method = new MethodDTO();
        method.setColor("#ababab");
        method.setIndex("0");
        method.setName("get orders");
        method.setMethodType(MethodType.HTTP_REQUEST);
        method.setRequest(request);
        method.setGlobalWrites(writes);
        ConnectorDTO connector = new ConnectorDTO();
        connector.setConnectorId(ConnectionConstants.DEFAULT_CONNECTOR_ID);
        connector.setTitle(ConnectionConstants.DEFAULT_CONNECTOR_NAME);
        connector.setMethods(new ArrayList<>(List.of(method)));
        connector.setOperators(new ArrayList<>());
        ConnectionDTO workflow = new ConnectionDTO();
        workflow.setConnectionId(7L);
        workflow.setTitle("sync orders");
        workflow.setFromConnector(connector);
        return workflow;
    }
}

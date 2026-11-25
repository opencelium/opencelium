/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.template.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.enums.MethodType;
import com.becon.opencelium.backend.mapper.others.ConnectionOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.ConnectionOldDtoAndTemplateMapperImpl;
import com.becon.opencelium.backend.mapper.others.ConnectorOldDTOAndTemplateMapperImpl;
import com.becon.opencelium.backend.mapper.others.ConnectorOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.EnhancementOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.FieldBindingOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.MethodOldDTOMapperImpl;
import com.becon.opencelium.backend.mapper.others.OperatorOldDTOMapperImpl;
import com.becon.opencelium.backend.resource.connection.ConditionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldDTO;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Unit tests for {@link TemplateServiceImp#getByConnectionId}, the export of a saved workflow as
 * a template file, focused on its global variable references (OC-1691).
 *
 * <p>A template carries a reference the way the workflow holds it: as text that names the
 * variable, {@code {{global.name}}}, and as the targets of a method's {@code globalWrites}.
 * Neither export nor upload resolves or checks a reference; a workflow saved from the template
 * is checked like any other new workflow.
 *
 * <p>Runs the MapStruct-generated mappers the service uses, wired by hand, and follows the file
 * the way it travels: exported as the editor downloads it, read back as an upload reads it, and
 * returned as {@code GET /template/{id}} returns it to the editor.
 *
 * <p>Run with: ./gradlew test --tests "*.TemplateServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
class TemplateServiceImpTest {

    private static final long WORKFLOW_ID = 7L;
    private static final String RUNNING_VERSION = "5.0";
    private static final String SOURCE_COLOR = "#ababab";
    private static final String TARGET_COLOR = "#cdcdcd";
    private static final String LAST_SYNC_WRITE = SOURCE_COLOR + ".(response).body.$.updatedAt";
    private static final String ENHANCEMENT_ARGS =
            "//var VAR_0 = " + SOURCE_COLOR + ".(response).body.$.date;"
                    + "//var VAR_1 = {{global.formatDate}};";
    private static final String ENHANCEMENT_SCRIPT =
            "set(\"{{global.counter}}\", ref(\"{{global.counter}}\") + 1);"
                    + "RESULT_VAR = VAR_1(VAR_0, 'dd.MM');";

    @Mock
    private ConnectionService connectionService;

    @Mock
    private EntityVersionManager entityVersionManager;

    @Mock
    private OpenceliumProps ocProps;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private TemplateServiceImp templateService;

    @BeforeEach
    void setUp() {
        templateService = new TemplateServiceImp(connectionService, templateMapper(),
                oldDtoMapper(), entityVersionManager, ocProps, objectMapper);
    }

    @Test
    @DisplayName("getByConnectionId — the export keeps the mutable variables a method writes")
    void getByConnectionIdKeepsGlobalWritesWhenMethodWritesMutableVariable() throws Exception {
        MethodDTO method = aMethod("https://shop.example/orders");
        method.setGlobalWrites(Map.of("global.lastSync", LAST_SYNC_WRITE));
        givenWorkflow(aWorkflow(List.of(method), List.of(), List.of()));

        JsonNode exported = downloaded(templateService.getByConnectionId(WORKFLOW_ID));

        assertThat(exported.at("/connection/fromConnector/methods/0/globalWrites"))
                .isEqualTo(objectMapper.valueToTree(Map.of("global.lastSync", LAST_SYNC_WRITE)));
    }

    @Test
    @DisplayName("getByConnectionId — a method that writes nothing exports as it did before")
    void getByConnectionIdLeavesGlobalWritesOutWhenMethodWritesNothing() throws Exception {
        MethodDTO method = aMethod("https://shop.example/orders");
        method.setGlobalWrites(Map.of());
        givenWorkflow(aWorkflow(List.of(method), List.of(), List.of()));

        JsonNode exported = downloaded(templateService.getByConnectionId(WORKFLOW_ID));

        assertThat(exported.at("/connection/fromConnector/methods/0").has("globalWrites"))
                .isFalse();
    }

    @Test
    @DisplayName("getByConnectionId — every global reference survives export, upload and load")
    void getByConnectionIdKeepsEveryGlobalReferenceWhenTemplateIsUploadedAndLoaded()
            throws Exception {
        givenWorkflow(aWorkflowWithEveryKindOfGlobalReference());

        JsonNode loaded =
                loadedAfterUpload(downloaded(templateService.getByConnectionId(WORKFLOW_ID)));

        JsonNode method = loaded.at("/connection/fromConnector/methods/0");
        assertThat(method.at("/request/endpoint").asText()).isEqualTo("{{global.baseUrl}}/orders");
        assertThat(method.at("/request/header/X-Tenant").asText())
                .isEqualTo("{{global.tenant.id}}");
        assertThat(method.at("/request/body/fields/filter/since").asText())
                .isEqualTo("{{global.lastSync}}");
        assertThat(method.at("/globalWrites/global.lastSync").asText()).isEqualTo(LAST_SYNC_WRITE);
        JsonNode operators = loaded.at("/connection/fromConnector/operators");
        assertThat(operators.at("/0/condition/rightStatement/rightPropertyValue").asText())
                .isEqualTo("{{global.retryConfig.max}}");
        assertThat(operators.at("/1/expression").asText()).isEqualTo("{{global.tenants}}");
        JsonNode enhancement = loaded.at("/connection/fieldBinding/0/enhancement");
        assertThat(enhancement.at("/expertVar").asText()).isEqualTo(ENHANCEMENT_ARGS);
        assertThat(enhancement.at("/expertCode").asText()).isEqualTo(ENHANCEMENT_SCRIPT);
    }

    // ---------------------------------------------------------------- the file on its way

    /** The export as the editor saves it to disk: the JSON the endpoint returns. */
    private JsonNode downloaded(TemplateResource template) throws Exception {
        return objectMapper.readTree(objectMapper.writeValueAsString(template));
    }

    /**
     * The file once it is uploaded, read into a {@link Template} as {@code POST
     * /storage/template} reads it, and returned as {@code GET /template/{id}} returns it.
     */
    private JsonNode loadedAfterUpload(JsonNode file) throws Exception {
        Template uploaded = new ObjectMapper().readValue(file.toString(), Template.class);
        TemplateResource returned = templateService.toResource(uploaded);
        return objectMapper.readTree(objectMapper.writeValueAsString(returned));
    }

    // ---------------------------------------------------------------- workflows

    private void givenWorkflow(ConnectionDTO workflow) {
        when(connectionService.getFullConnection(WORKFLOW_ID)).thenReturn(workflow);
        when(ocProps.getVersion()).thenReturn(RUNNING_VERSION);
    }

    /**
     * A workflow that holds a global variable reference in each place a template must carry:
     * the endpoint, a header and the body of a method, the variables the method writes, the
     * condition of an {@code if}, the source of a {@code for}, and the args and the code of an
     * enhancement, where an arg imports a script and the code writes and reads a variable.
     */
    private static ConnectionDTO aWorkflowWithEveryKindOfGlobalReference() {
        MethodDTO method = aMethod("{{global.baseUrl}}/orders");
        method.getRequest().setHeader(Map.of("X-Tenant", "{{global.tenant.id}}"));
        BodyDTO body = new BodyDTO();
        body.setFields(Map.of("filter", Map.of("since", "{{global.lastSync}}")));
        method.getRequest().setBody(body);
        method.setGlobalWrites(Map.of("global.lastSync", LAST_SYNC_WRITE));

        StatementDTO left = new StatementDTO();
        left.setColor(SOURCE_COLOR);
        left.setField("(response).success.$.attempts");
        StatementDTO right = new StatementDTO();
        right.setRightPropertyValue("{{global.retryConfig.max}}");
        ConditionDTO condition = new ConditionDTO();
        condition.setLeftStatement(left);
        condition.setRelationalOperator("<");
        condition.setRightStatement(right);
        OperatorDTO ifOperator = new OperatorDTO();
        ifOperator.setType("if");
        ifOperator.setIndex("1");
        ifOperator.setCondition(condition);

        OperatorDTO forOperator = new OperatorDTO();
        forOperator.setType("for");
        forOperator.setIndex("2");
        forOperator.setIterator("i");
        forOperator.setExpression("{{global.tenants}}");

        EnhancementDTO enhancement = new EnhancementDTO();
        enhancement.setTitle("format the order date");
        enhancement.setArgs(ENHANCEMENT_ARGS);
        enhancement.setScript(ENHANCEMENT_SCRIPT);
        enhancement.setLanguage("js");
        FieldBindingDTO binding = new FieldBindingDTO();
        binding.setFrom(List.of(aLinkedField(SOURCE_COLOR, "date")));
        binding.setTo(List.of(aLinkedField(TARGET_COLOR, "orderDate")));
        binding.setEnhancement(enhancement);

        return aWorkflow(List.of(method), List.of(ifOperator, forOperator), List.of(binding));
    }

    private static ConnectionDTO aWorkflow(List<MethodDTO> methods, List<OperatorDTO> operators,
            List<FieldBindingDTO> bindings) {
        ConnectorDTO connector = new ConnectorDTO();
        connector.setConnectorId(ConnectionConstants.DEFAULT_CONNECTOR_ID);
        connector.setTitle(ConnectionConstants.DEFAULT_CONNECTOR_NAME);
        connector.setMethods(new ArrayList<>(methods));
        connector.setOperators(new ArrayList<>(operators));
        ConnectionDTO workflow = new ConnectionDTO();
        workflow.setConnectionId(WORKFLOW_ID);
        workflow.setTitle("sync orders");
        workflow.setFromConnector(connector);
        workflow.setFieldBinding(new ArrayList<>(bindings));
        return workflow;
    }

    private static MethodDTO aMethod(String endpoint) {
        RequestDTO request = new RequestDTO();
        request.setEndpoint(endpoint);
        request.setMethod("GET");
        MethodDTO method = new MethodDTO();
        method.setColor(SOURCE_COLOR);
        method.setIndex("0");
        method.setName("get orders");
        method.setMethodType(MethodType.HTTP_REQUEST);
        method.setRequest(request);
        return method;
    }

    private static LinkedFieldDTO aLinkedField(String color, String field) {
        LinkedFieldDTO linked = new LinkedFieldDTO();
        linked.setColor(color);
        linked.setType("response");
        linked.setField(field);
        return linked;
    }

    // ---------------------------------------------------------------- mappers

    /** The chain the service turns a workflow into its old form with. */
    private static ConnectionOldDTOMapperImpl oldDtoMapper() {
        ConnectorOldDTOMapperImpl connectorMapper = new ConnectorOldDTOMapperImpl();
        ReflectionTestUtils.setField(connectorMapper, "methodOldDTOMapper",
                new MethodOldDTOMapperImpl());
        ReflectionTestUtils.setField(connectorMapper, "operatorOldDTOMapper",
                new OperatorOldDTOMapperImpl());
        FieldBindingOldDTOMapperImpl bindingMapper = new FieldBindingOldDTOMapperImpl();
        ReflectionTestUtils.setField(bindingMapper, "enhancementOldDTOMapper",
                new EnhancementOldDTOMapperImpl());
        ConnectionOldDTOMapperImpl connectionMapper = new ConnectionOldDTOMapperImpl();
        ReflectionTestUtils.setField(connectionMapper, "connectorOldDTOMapper", connectorMapper);
        ReflectionTestUtils.setField(connectionMapper, "fieldBindingOldDTOMapper", bindingMapper);
        return connectionMapper;
    }

    /** The mapper the service turns the old form into a template with. */
    private static ConnectionOldDtoAndTemplateMapperImpl templateMapper() {
        ConnectionOldDtoAndTemplateMapperImpl templateMapper =
                new ConnectionOldDtoAndTemplateMapperImpl();
        ReflectionTestUtils.setField(templateMapper, "connectorOldDTOAndTemplateMapper",
                new ConnectorOldDTOAndTemplateMapperImpl());
        return templateMapper;
    }
}

package com.becon.opencelium.backend.unit.execution.jump;

import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.aGraphQlOperation;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.anXmlOperation;
import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.execution.jump.ExecutionJumpGraphBuilder;
import com.becon.opencelium.backend.execution.jump.JumpGraph;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link ExecutionJumpGraphBuilder}.
 *
 * <p>Run with: ./gradlew test --tests "*.ExecutionJumpGraphBuilderTest"
 */
@DisplayName("ExecutionJumpGraphBuilder — unit")
class ExecutionJumpGraphBuilderTest {

    // the color OperationDTOFixture gives every method it maps
    private static final String METHOD_COLOR = "#ababab";

    @Test
    @DisplayName("build — a GraphQL method depends on the methods its variables read, not on text in its query")
    void buildReadsOnlyVariablesWhenMethodBodyIsGraphQl() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("query", "query Item($id: ID!) { item(id: \"{%#cd34ef.(response).id%}\") { name } }");
        body.put("variables", Map.of("id", "#ab12cd.(response).id"));
        ConnectorEx connector = aConnectorWith(aGraphQlOperation(body));

        JumpGraph graph = ExecutionJumpGraphBuilder.build(connector, List.of());

        assertThat(graph.methodByColor(METHOD_COLOR).referencedColors()).containsExactly("#ab12cd");
    }

    @Test
    @DisplayName("build — an XML method depends on the methods its attribute values read")
    void buildReadsAttributeValuesWhenMethodBodyIsXml() {
        Map<String, Object> element = new LinkedHashMap<>();
        element.put("__oc__attributes", Map.of("id", "#ab12cd.(response).id"));
        element.put("__oc__value", "x");
        ConnectorEx connector = aConnectorWith(anXmlOperation(Map.of("a", element)));

        JumpGraph graph = ExecutionJumpGraphBuilder.build(connector, List.of());

        assertThat(graph.methodByColor(METHOD_COLOR).referencedColors()).containsExactly("#ab12cd");
    }

    private static ConnectorEx aConnectorWith(OperationDTO... methods) {
        ConnectorEx connector = new ConnectorEx();
        connector.setMethods(List.of(methods));
        return connector;
    }
}

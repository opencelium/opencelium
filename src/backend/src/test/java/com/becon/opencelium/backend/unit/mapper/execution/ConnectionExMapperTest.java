package com.becon.opencelium.backend.unit.mapper.execution;

import static com.becon.opencelium.backend.testutil.fixture.ConnectionMngFixture.aMethod;
import static com.becon.opencelium.backend.testutil.fixture.ConnectionMngFixture.aWorkflowWith;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PUBLIC;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aConnector;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aRequiredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aStoredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.anInvokerRequiring;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aSnapshotOf;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.anOpenEntry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.entry;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.execution.ConnectionExMapper;
import com.becon.opencelium.backend.mapper.execution.ConnectorExMapper;
import com.becon.opencelium.backend.mapper.execution.FieldBindExMapper;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.mapper.execution.OperatorExMapper;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link ConnectionExMapper}: what a run gets for the connectors of its workflow.
 *
 * <p>The {@link ConnectorExMapper} is the real one over mocked services, so a connector field
 * goes through the same steps as in a run; the mappers of methods, operators and field bindings
 * are mocked and give nothing.
 *
 * <p>Run with: ./gradlew test --tests "*.ConnectionExMapperTest"
 */
@DisplayName("ConnectionExMapper — unit")
@ExtendWith(MockitoExtension.class)
class ConnectionExMapperTest {

    private static final int CMDB_ID = 3;
    private static final String INVOKER = "idoit";

    @Mock
    ConnectorService connectorService;

    @Mock
    OperationExMapper operationExMapper;

    @Mock
    OperatorExMapper operatorExMapper;

    @Mock
    InvokerService invokerService;

    @Mock
    FieldBindExMapper fieldBindExMapper;

    private ConnectionExMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ConnectionExMapper(
                new ConnectorExMapper(connectorService, operationExMapper, operatorExMapper, invokerService),
                fieldBindExMapper);
    }

    @Test
    @DisplayName("toEntity — the connector of a method gets the global variables of its fields from the snapshot "
            + "of the run")
    void toEntityReadsConnectorFieldsWithRunSnapshotWhenMethodsHaveConnectors() {
        ConnectionMng workflow = aWorkflowWith(aMethodOfConnector(CMDB_ID));
        workflow.getFromConnector().setConnectorId(ConnectionConstants.DEFAULT_CONNECTOR_ID);
        when(connectorService.getById(CMDB_ID)).thenReturn(
                aConnector(CMDB_ID, INVOKER, aStoredField("url", "{{global.idoitUrl}}/api", PUBLIC)));
        when(invokerService.findByName(INVOKER))
                .thenReturn(anInvokerRequiring(INVOKER, aRequiredField("url", null, PUBLIC)));
        GlobalVariableSnapshot runSnapshot = aSnapshotOf(anOpenEntry("idoitUrl", "https://cmdb.example.test"));

        ConnectionEx connectionEx = mapper.toEntity(workflow, runSnapshot);

        assertThat(connectionEx.getConnectors().get(CMDB_ID).getRequiredData())
                .containsExactly(entry("url", "https://cmdb.example.test/api"));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** A method that is sent through connector {@code connectorId}, the way a 5.0 workflow stores it. */
    private static MethodMng aMethodOfConnector(int connectorId) {
        MethodConnectorMng connector = new MethodConnectorMng();
        connector.setConnectorId(connectorId);

        MethodMng method = aMethod("#FFCFB5", "0", "getObjects", "{url}/objects");
        method.setConnector(connector);
        return method;
    }
}

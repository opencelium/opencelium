package com.becon.opencelium.backend.unit.mapper.execution;

import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PRIVATE;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PUBLIC;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aConnector;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aFunction;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aRequiredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aStoredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.anInvokerRequiring;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aScopedEntry;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aSnapshotOf;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.anOpenEntry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.assertj.core.api.Assertions.entry;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.execution.ConnectorExMapper;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.mapper.execution.OperatorExMapper;
import com.becon.opencelium.backend.resource.execution.MethodConnectorEx;
import com.becon.opencelium.backend.testutil.fake.FakeHttpServer;
import com.becon.opencelium.backend.testutil.fake.FakeHttpServer.RecordedRequest;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link ConnectorExMapper#toMethodConnector}.
 *
 * <p>The services are mocked; the step that computes the fields ({@code RequiredDataServiceImp})
 * is the real one, because the mapper creates it itself. Where a field is computed by an invoker
 * function, the request goes to a {@link FakeHttpServer}; in every other test no request is sent.
 *
 * <p>Run with: ./gradlew test --tests "*.ConnectorExMapperTest"
 */
@DisplayName("ConnectorExMapper — unit")
@ExtendWith(MockitoExtension.class)
class ConnectorExMapperTest {

    private static final String INVOKER = "Shop";

    @Mock
    ConnectorService connectorService;

    @Mock
    OperationExMapper operationExMapper;

    @Mock
    OperatorExMapper operatorExMapper;

    @Mock
    InvokerService invokerService;

    @InjectMocks
    ConnectorExMapper mapper;

    @Test
    @DisplayName("toMethodConnector — a field the connector never stored takes the invoker's default")
    void toMethodConnectorAddsInvokerFieldsWhenConnectorLacksThem() {
        Connector connector = aConnector(3, INVOKER, aStoredField("url", "http://api.test", PUBLIC));
        Invoker invoker = anInvokerRequiring(INVOKER,
                aRequiredField("url", null, PUBLIC),
                aRequiredField("region", "eu", PRIVATE));
        when(invokerService.findByName(INVOKER)).thenReturn(invoker);

        MethodConnectorEx resolved = mapper.toMethodConnector(connector, GlobalVariableSnapshot::empty);

        assertThat(resolved.getRequiredData())
                .containsExactlyInAnyOrderEntriesOf(Map.of("url", "http://api.test", "region", "eu"));
    }

    // ── global variables in the fields of a connector ─────────────────────────

    @Test
    @DisplayName("toMethodConnector — a field that holds a global variable gets its value, it is not taken for a "
            + "reference to another field")
    void toMethodConnectorResolvesGlobalWhenFieldHoldsOne() {
        Connector connector = aConnector(3, INVOKER, aStoredField("url", "{{global.idoitUrl}}/api", PUBLIC));
        when(invokerService.findByName(INVOKER))
                .thenReturn(anInvokerRequiring(INVOKER, aRequiredField("url", null, PUBLIC)));
        GlobalVariableSnapshot globals = aSnapshotOf(anOpenEntry("idoitUrl", "https://cmdb.example.test"));

        MethodConnectorEx resolved = mapper.toMethodConnector(connector, () -> globals);

        assertThat(resolved.getRequiredData()).containsExactly(entry("url", "https://cmdb.example.test/api"));
    }

    @Test
    @DisplayName("toMethodConnector — a field computed by an invoker function is requested at the address a "
            + "global variable gives")
    void toMethodConnectorComputesFieldWithResolvedValuesWhenAnotherFieldHoldsGlobal() {
        try (FakeHttpServer api = FakeHttpServer.start()) {
            api.respondWith(200, "application/json", "{\"access_token\":\"t0k3n\"}");
            Connector connector = aConnector(3, INVOKER,
                    aStoredField("url", "{{global.idoitUrl}}/cmdb", PUBLIC),
                    aStoredField("token", "%{login.body.access_token}", PRIVATE));
            Invoker invoker = anInvokerRequiring(INVOKER,
                    aRequiredField("url", null, PUBLIC),
                    aRequiredField("token", null, PRIVATE));
            invoker.setOperations(List.of(aFunction("login", "GET", "{url}/login")));
            when(invokerService.findByName(INVOKER)).thenReturn(invoker);
            GlobalVariableSnapshot globals = aSnapshotOf(anOpenEntry("idoitUrl", api.baseUrl()));

            MethodConnectorEx resolved = mapper.toMethodConnector(connector, () -> globals);

            assertThat(resolved.getRequiredData()).containsEntry("token", "t0k3n");
            assertThat(api.requests()).extracting(RecordedRequest::uri).containsExactly("/cmdb/login");
        }
    }

    @Test
    @DisplayName("toMethodConnector — reading the variables costs a query, so it is left out where no field "
            + "needs them")
    void toMethodConnectorAsksForNoVariablesWhenNoFieldHoldsReference() {
        Connector connector = aConnector(3, INVOKER, aStoredField("url", "http://api.test", PUBLIC));
        when(invokerService.findByName(INVOKER))
                .thenReturn(anInvokerRequiring(INVOKER, aRequiredField("url", null, PUBLIC)));
        AtomicInteger timesAsked = new AtomicInteger();

        mapper.toMethodConnector(connector, () -> {
            timesAsked.incrementAndGet();
            return GlobalVariableSnapshot.empty();
        });

        assertThat(timesAsked).hasValue(0);
    }

    @Test
    @DisplayName("toMethodConnector — a connector is shared by every workflow, so a scoped variable is not for it")
    void toMethodConnectorThrowsGlobalVariableNotFoundExceptionWhenVariableIsScoped() {
        Connector connector = aConnector(3, INVOKER, aStoredField("token", "{{global.apiKey}}", PRIVATE));
        when(invokerService.findByName(INVOKER))
                .thenReturn(anInvokerRequiring(INVOKER, aRequiredField("token", null, PRIVATE)));
        GlobalVariableSnapshot globals = aSnapshotOf(aScopedEntry("apiKey", "k3y"));

        GlobalVariableNotFoundException notFound = catchThrowableOfType(
                () -> mapper.toMethodConnector(connector, () -> globals), GlobalVariableNotFoundException.class);

        assertThat(notFound)
                .hasMessageContaining("'apiKey'")
                .hasMessageContaining("is not open to all workflows");
        assertThat(notFound.getName()).isEqualTo("apiKey");
    }
}

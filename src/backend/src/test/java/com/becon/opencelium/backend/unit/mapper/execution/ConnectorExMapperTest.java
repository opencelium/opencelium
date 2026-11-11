package com.becon.opencelium.backend.unit.mapper.execution;

import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PRIVATE;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PUBLIC;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aConnector;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aRequiredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aStoredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.anInvokerRequiring;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.execution.ConnectorExMapper;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.mapper.execution.OperatorExMapper;
import com.becon.opencelium.backend.resource.execution.MethodConnectorEx;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link ConnectorExMapper#toMethodConnector}. Values hold no references, so no
 * invoker function is called.
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

        MethodConnectorEx resolved = mapper.toMethodConnector(connector);

        assertThat(resolved.getRequiredData())
                .containsExactlyInAnyOrderEntriesOf(Map.of("url", "http://api.test", "region", "eu"));
    }
}

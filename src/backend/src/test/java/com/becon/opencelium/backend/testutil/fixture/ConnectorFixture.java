package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.resource.execution.MethodConnectorEx;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Object mother for connectors, their stored request data and their invoker definition.
 */
public final class ConnectorFixture {

    public static final String PUBLIC = "public";
    public static final String PRIVATE = "private";

    private ConnectorFixture() {}

    /** A connector of {@code invoker} with {@code fields} stored as its request data. */
    public static Connector aConnector(int id, String invoker, RequestData... fields) {
        Connector connector = new Connector();
        connector.setId(id);
        connector.setTitle("connector-" + id);
        connector.setInvoker(invoker);
        connector.setRequestData(new ArrayList<>(Arrays.asList(fields)));
        return connector;
    }

    public static RequestData aStoredField(String field, String value, String visibility) {
        RequestData data = new RequestData(field, value);
        data.setVisibility(visibility);
        return data;
    }

    /** An invoker named {@code name} that requires {@code fields}. */
    public static Invoker anInvokerRequiring(String name, RequiredData... fields) {
        Invoker invoker = InvokerFixture.anInvokerNamed(name);
        invoker.setRequiredData(new ArrayList<>(Arrays.asList(fields)));
        invoker.setOperations(List.of());
        return invoker;
    }

    public static RequiredData aRequiredField(String name, String value, String visibility) {
        RequiredData data = new RequiredData();
        data.setName(name);
        data.setValue(value);
        data.setVisibility(visibility);
        return data;
    }

    /** The execution view of connector {@code id} once its request data is resolved. */
    public static MethodConnectorEx aResolvedConnector(int id, Map<String, String> requiredData) {
        MethodConnectorEx connector = new MethodConnectorEx();
        connector.setId(id);
        connector.setTitle("connector-" + id);
        connector.setRequiredData(new HashMap<>(requiredData));
        return connector;
    }
}

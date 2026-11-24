package com.becon.opencelium.backend.resource.connection.methodtest;

import com.becon.opencelium.backend.reference.enums.ReferenceType;
import java.util.List;

/**
 * Result of {@code POST /connection/method/test/refs}: the references the request of a method
 * resolves, split by where their value comes from in a test.
 *
 * @param connectorReferences references read from a connector
 * @param staticReferences references that need a static value to run the test
 */
public record MethodTestReferencesDTO(
        List<ConnectorReference> connectorReferences, List<StaticReference> staticReferences) {

    public MethodTestReferencesDTO {
        connectorReferences = List.copyOf(connectorReferences);
        staticReferences = List.copyOf(staticReferences);
    }

    /**
     * A reference to the data of a connector, {@code {key}} or {@code {#connectorId.key}}.
     *
     * @param available whether the connector exists and defines {@code key}; when it does not, the
     *     reference is sent as written, like in a connection execution
     */
    public record ConnectorReference(
            String reference, int connectorId, String key, boolean available) {}

    /**
     * A reference whose data the test does not produce.
     *
     * @param type the kind of reference, or {@code null} when the text is not a valid reference
     */
    public record StaticReference(String reference, ReferenceType type) {}
}

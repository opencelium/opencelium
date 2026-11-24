package com.becon.opencelium.backend.resource.connection.methodtest;

import com.becon.opencelium.backend.reference.enums.ReferenceType;
import java.util.List;

/**
 * Result of {@code POST /connection/method/test/refs}: the references the request of a method
 * resolves, split by where their value comes from in a test.
 *
 * @param connectorReferences references read from a connector
 * @param staticReferences references that need a static value to run the test
 * @param globalReferences global variable references the test resolves by itself, with the value
 *     the variable has now
 */
public record MethodTestReferencesDTO(
        List<ConnectorReference> connectorReferences,
        List<StaticReference> staticReferences,
        List<GlobalVariableReference> globalReferences) {

    public MethodTestReferencesDTO {
        connectorReferences = List.copyOf(connectorReferences);
        staticReferences = List.copyOf(staticReferences);
        globalReferences = List.copyOf(globalReferences);
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

    /**
     * A global variable reference, {@code {{global.name}}} with an optional path, that needs no
     * static value: the user may use the variable in the workflow of the method, so the test reads
     * its current value. A static value given for it still wins. The value itself is not listed.
     *
     * @param reference the reference exactly as written in the method
     * @param name the name of the variable
     */
    public record GlobalVariableReference(String reference, String name) {}
}

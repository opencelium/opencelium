package com.becon.opencelium.backend.reference;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParameterDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Collects the references the request of an operation resolves when it is built.
 *
 * <p>Visits the same values {@code RequestEntityBuilder} hands to the reference resolver (the
 * schema of every parameter and of the request body) and splits each value the way {@code
 * ExecutionManagerImpl.getValue} does: a value with embedded references contributes each of them,
 * any other value containing a reference is a single reference.
 */
public final class OperationReferenceCollector {

    private OperationReferenceCollector() {}

    /**
     * Returns the references of {@code operation} in the order they first appear, without
     * duplicates.
     */
    public static Set<String> collect(OperationDTO operation) {
        Set<String> references = new LinkedHashSet<>();

        if (operation.getParameters() != null) {
            for (ParameterDTO parameter : operation.getParameters()) {
                if (parameter != null) {
                    collect(parameter.getSchema(), references);
                }
            }
        }

        if (operation.getRequestBody() != null) {
            collect(operation.getRequestBody().getSchema(), references);
        }

        return Collections.unmodifiableSet(references);
    }

    private static void collect(SchemaDTO schema, Set<String> references) {
        // a literal value is sent as written, so it holds no reference
        if (schema == null || schema.isLiteral()) {
            return;
        }

        // the attributes of an XML element are resolved whatever its content
        if (schema.getXml() != null) {
            schema.getXml().getAttributes().values().forEach(text -> collect(text, references));
        }

        String value = schema.getValue();
        if (collect(value, references)) {
            // a referenced value replaces the whole schema, so nothing below it is resolved
            return;
        }

        if (schema.getType() == DataType.ARRAY && schema.getItems() != null) {
            schema.getItems().forEach(item -> collect(item, references));
        }

        if (schema.getType() == DataType.OBJECT && schema.getProperties() != null) {
            schema.getProperties().values().forEach(property -> collect(property, references));
        }
    }

    /** Adds the references of {@code text}, and tells whether it holds any. */
    private static boolean collect(String text, Set<String> references) {
        if (!ReferenceDetector.containsReference(text)) {
            return false;
        }

        List<String> embedded = ReferenceScanner.extract(text);
        references.addAll(embedded.isEmpty() ? List.of(text) : embedded);
        return true;
    }
}

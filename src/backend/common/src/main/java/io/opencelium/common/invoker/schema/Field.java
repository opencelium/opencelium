package io.opencelium.common.invoker.schema;

import java.util.Objects;

/**
 * A named member of an {@link ObjectSchema}.
 *
 * <p>The name is kept exactly as the API uses it. JSON keys may contain spaces and punctuation
 * ({@code "range from"} is a real example), so the only rule is that a name is not blank.
 *
 * @param name   the key as it appears in the payload
 * @param schema the shape of the value under that key
 */
public record Field(String name, Schema schema) {

    public Field {
        Objects.requireNonNull(name, "field name must not be null");
        Objects.requireNonNull(schema, "schema of field '" + name + "' must not be null");
        if (name.isBlank()) {
            throw new IllegalArgumentException("field name must not be blank");
        }
    }

    public static Field of(String name, Schema schema) {
        return new Field(name, schema);
    }
}

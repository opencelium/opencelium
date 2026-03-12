package com.becon.opencelium.backend.utility.migrate;

import java.util.Arrays;
import java.util.Objects;

/**
 * Represents the different types of operations that can be applied during YAML migration process.
 *
 * <p>Each operation is translated to a JSON Patch (RFC 6902) operation when applied:</p>
 * <ul>
 *     <li>{@link #ADD} – Add a new property or value. Translates to JSON Patch {@code add}.
 *         If the path already exists, the existing value is overwritten (same effect as replace).</li>
 *     <li>{@link #DELETE} – Remove an existing property or value. Translates to JSON Patch {@code remove}.</li>
 *     <li>{@link #MODIFY} – Update an existing property with a new value. Translates to JSON Patch {@code add},
 *         which overwrites the value if the path exists or creates it if the path is absent,
 *         avoiding the {@code replace} failure when the target path is missing.</li>
 *     <li>{@link #RENAME} – Rename a property key while preserving its value. Implemented as
 *         JSON Patch {@code add} (new key) followed by {@code remove} (old key).</li>
 *     <li>{@link #MOVE} – Move a property or value from one path to another. Translates to
 *         JSON Patch {@code add} (destination) followed by {@code move}.</li>
 * </ul>
 */
public enum OperationType {
    ADD("add"),
    DELETE("delete"),
    MODIFY("modify"),
    RENAME("rename"),
    MOVE("move");

    private final String value;

    OperationType(String value) {
        this.value = value;
    }

    public static OperationType getFromNameOrElseNull(String operation) {
        return Arrays.stream(values())
                .filter(op -> Objects.equals(op.getValue(), operation))
                .findFirst()
                .orElse(null);
    }

    public static OperationType getFromNameOrElseThrow(String operation) {
        return Arrays.stream(values())
                .filter(op -> Objects.equals(op.getValue(), operation))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("'%s' is not a valid operation type".formatted(operation)));
    }

    public String getValue() {
        return value;
    }
}
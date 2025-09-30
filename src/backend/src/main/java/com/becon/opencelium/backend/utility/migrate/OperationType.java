package com.becon.opencelium.backend.utility.migrate;

import java.util.Arrays;
import java.util.Objects;

/**
 * Represents the different types of operations that can be applied during YAML migration process
 *
 * <p>Supported operations:</p>
 * <ul>
 *     <li>{@link #ADD} – Add a new property or value.</li>
 *     <li>{@link #DELETE} – Remove an existing property or value.</li>
 *     <li>{@link #MODIFY} – Replace an existing property or value with a new one.</li>
 *     <li>{@link #RENAME} – Rename a property by moving its value to a new key.</li>
 *     <li>{@link #MOVE} – Move a property or value from one location to another.</li>
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
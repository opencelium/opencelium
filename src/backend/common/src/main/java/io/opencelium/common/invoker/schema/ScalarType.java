package io.opencelium.common.invoker.schema;

import java.util.Arrays;

/** The type of a single, indivisible value. */
public enum ScalarType {

    /** Text, including dates and identifiers that are not numbers. */
    STRING("string"),

    /** Any number, including decimals. */
    NUMBER("number"),

    /** A whole number. */
    INTEGER("integer"),

    /** {@code true} or {@code false}. */
    BOOLEAN("boolean");

    private final String value;

    ScalarType(String value) {
        this.value = value;
    }

    /** The name used in an invoker file, for example {@code integer}. */
    public String value() {
        return value;
    }

    /**
     * Resolves a scalar type from its name in an invoker file, ignoring case.
     *
     * @throws IllegalArgumentException if the name is not a scalar type
     */
    public static ScalarType fromValue(String value) {
        return Arrays.stream(values())
                .filter(type -> type.value.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("'" + value + "' is not a scalar type; "
                        + "expected string, number, integer or boolean"));
    }
}

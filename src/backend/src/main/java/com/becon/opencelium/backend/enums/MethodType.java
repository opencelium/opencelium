package com.becon.opencelium.backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Kind of a connection method (operation).
 * <p>
 * Wire values are a frozen contract ({@code CONNECTOR}, {@code HTTP_REQUEST}, {@code WEBHOOK}):
 * they are persisted in every method document in MongoDB and hardcoded on the UI side.
 * Never rename a value; adding a new constant requires a coordinated UI release.
 * <p>
 * A method with no type ({@code null}) is legacy data and keeps the pre-type behavior:
 * the invoker is inferred from the enclosing/own connector, falling back to a plain
 * http request when none resolves.
 */
public enum MethodType {
    CONNECTOR("CONNECTOR"),
    HTTP_REQUEST("HTTP_REQUEST"),
    WEBHOOK("WEBHOOK");

    private final String value;

    MethodType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static MethodType fromValue(String value) {
        if (value == null) {
            return null;
        }
        return Arrays.stream(values())
                .filter(t -> t.value.equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown method type '" + value + "'. Accepted values: "
                                + Arrays.stream(values()).map(MethodType::getValue).collect(Collectors.joining(", "))));
    }
}

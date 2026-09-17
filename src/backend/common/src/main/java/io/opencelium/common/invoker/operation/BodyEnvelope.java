package io.opencelium.common.invoker.operation;

import java.util.Arrays;

/**
 * A convention for wrapping a body that is not captured by its media type alone.
 *
 * <p>A GraphQL request is ordinary {@code application/json}, but its body always has the same
 * three members; naming the envelope lets tools treat those members specially. The concept is
 * deliberately called an envelope rather than an encoding, because OpenAPI already uses
 * "encoding" for the serialization of individual multipart parts.
 */
public enum BodyEnvelope {

    /** GraphQL over HTTP: {@code query}, {@code variables} and {@code operationName}. */
    GRAPHQL("graphql");

    private final String value;

    BodyEnvelope(String value) {
        this.value = value;
    }

    /** The name used in an invoker file's {@code envelope} attribute. */
    public String value() {
        return value;
    }

    /**
     * Resolves an envelope from its name, ignoring case.
     *
     * @throws IllegalArgumentException if the name is not a known envelope
     */
    public static BodyEnvelope fromValue(String value) {
        return Arrays.stream(values())
                .filter(envelope -> envelope.value.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("'" + value + "' is not a body envelope; "
                        + "expected one of " + Arrays.stream(values()).map(BodyEnvelope::value).toList()));
    }
}

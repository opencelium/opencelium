package com.becon.opencelium.backend.reference.model;

import java.util.Objects;

/**
 * Represents an enhancement reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * #{%bindId%}
 * }</pre>
 *
 * <p>The inner expression contains {@code bindId} — a 24-character hexadecimal identifier
 * that binds this reference to a specific enhancement.
 *
 * <p>Examples:
 * <pre>{@code
 * #{%abcdef0123456789abcdef01%}
 * #{%ABCDEF0123456789ABCDEF01%}
 * }</pre>
 */
public final class EnhancementReference implements Reference {
    private final String raw;
    private final String bindId;

    private EnhancementReference(String raw, String bindId) {
        this.raw = raw;
        this.bindId = bindId;
    }

    @Override
    public ReferenceType getType() {
        return ReferenceType.ENHANCEMENT;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    public String getBindId() {
        return bindId;
    }

    /**
     * Parses a raw enhancement reference string into an {@link EnhancementReference}.
     *
     * <p>Expected syntax:
     * <pre>{@code
     * #{%bindId%}
     * }</pre>
     *
     * <p>The {@code bindId} must be exactly 24 hexadecimal characters and is used
     * to resolve the corresponding enhancement during execution.
     *
     * @param rawReference the raw enhancement reference (must start with "#{%" and end with "%}")
     * @return parsed {@link EnhancementReference} containing the enhancement binding id
     * @throws NullPointerException     if {@code rawReference} is {@code null}
     * @throws IllegalArgumentException if the reference syntax is invalid or
     *                                  the binding id is malformed
     */
    public static EnhancementReference parse(String rawReference) {
        Objects.requireNonNull(rawReference, "Enhancement reference is null");
        validate(rawReference);

        String bindId = rawReference.substring(3, rawReference.length() - 2);

        return new EnhancementReference(rawReference, bindId);
    }

    private static void validate(String rawReference) {
        if (!rawReference.startsWith("#{%") || !rawReference.endsWith("%}")) {
            throw new IllegalArgumentException("Invalid enhancement reference: " + rawReference);
        }

        // total length must be exactly 29
        if (rawReference.length() != 29) {
            throw new IllegalArgumentException("Enhancement binding id must be exactly 24 hexadecimal characters: " + rawReference);
        }

        // validate hexadecimal characters
        for (int i = 3; i < 27; i++) {
            char c = rawReference.charAt(i);
            if (Character.digit(c, 16) < 0) {
                throw new IllegalArgumentException("Invalid hex character '" + c + "' in enhancement reference: " + rawReference);
            }
        }
    }
}

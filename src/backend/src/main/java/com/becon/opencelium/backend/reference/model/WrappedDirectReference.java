package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.enums.ReferenceType;

import java.util.Objects;

import static com.becon.opencelium.backend.reference.enums.ReferenceType.WRAPPED_DIRECT;

/**
 * Represents a wrapped direct reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * {%#<direct-reference>%}
 * }</pre>
 *
 * <p>The wrapped value must be a valid {@link DirectReference}.
 *
 * <p>Examples:
 * <pre>{@code
 * {%#ababab.(response).body.$.field[*]%}
 * {%#A1b2C3.(request).status%}
 * }</pre>
 */
public final class WrappedDirectReference implements Reference {
    private final String raw;
    private final DirectReference directReference;

    private WrappedDirectReference(String raw, DirectReference directReference) {
        this.raw = raw;
        this.directReference = directReference;
    }

    @Override
    public ReferenceType getType() {
        return WRAPPED_DIRECT;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    /**
     * Returns the unwrapped direct reference.
     */
    public DirectReference getDirectReference() {
        return directReference;
    }

    /**
     * Parses a wrapped direct reference.
     *
     * @param rawReference wrapped reference string
     * @return parsed {@link WrappedDirectReference}
     * @throws NullPointerException if {@code s} is null
     * @throws IllegalArgumentException if the reference is invalid
     */
    public static WrappedDirectReference parse(String rawReference) {
        Objects.requireNonNull(rawReference, "null is not a reference");
        validate(rawReference);

        // unwrap "{%" and "%}"
        String inner = rawReference.substring(2, rawReference.length() - 2);

        // delegate full validation to DirectReference
        DirectReference direct = DirectReference.parse(inner);

        return new WrappedDirectReference(rawReference, direct);
    }

    private static void validate(String rawReference) {
        if (!rawReference.startsWith("{%#") || !rawReference.endsWith("%}")) {
            throw new IllegalArgumentException("Invalid syntax for " + WRAPPED_DIRECT + " reference: " + rawReference);
        }

        if (rawReference.length() <= 6) {
            throw new IllegalArgumentException("Empty direct reference in " + WRAPPED_DIRECT + " reference: " + rawReference);
        }
    }
}

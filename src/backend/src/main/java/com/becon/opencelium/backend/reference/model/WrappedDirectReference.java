package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.ReferenceType;

import java.util.Objects;

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
        return ReferenceType.WRAPPED_DIRECT;
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
     * @param s wrapped reference string
     * @return parsed {@link WrappedDirectReference}
     * @throws NullPointerException if {@code s} is null
     * @throws IllegalArgumentException if the reference is invalid
     */
    public static WrappedDirectReference parse(String s) {
        Objects.requireNonNull(s, "Wrapped direct reference is null");
        validate(s);

        // unwrap "{%" and "%}"
        String inner = s.substring(2, s.length() - 2);

        // delegate full validation to DirectReference
        DirectReference direct = DirectReference.parse(inner);

        return new WrappedDirectReference(s, direct);
    }

    /**
     * Validates the wrapped-direct structure only.
     * <p>Does NOT validate the inner direct reference.
     */
    private static void validate(String s) {
        if (!s.startsWith("{%#") || !s.endsWith("%}")) {
            throw new IllegalArgumentException("Invalid wrapped direct reference: " + s);
        }

        // minimal sanity check (must contain something meaningful inside)
        if (s.length() <= 6) { // "{%#x%}"
            throw new IllegalArgumentException("Invalid wrapped direct reference: " + s);
        }
    }
}

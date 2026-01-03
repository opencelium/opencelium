package com.becon.opencelium.backend.reference.model;

import java.util.Objects;

/**
 * Represents a request data reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * {key}
 * {#ctorId.key}
 * }</pre>
 *
 * <p>The {@code ctorId} is optional and refers to a specific connector.
 * If it is not specified, the current connector id is used.
 *
 * <p>Examples:
 * <pre>{@code
 * {username}
 * {#12.username}
 * }</pre>
 */
public final class RequestDataReference implements Reference {
    private final String raw;
    private final Integer ctorId;
    private final String key;

    private RequestDataReference(String raw, Integer ctorId, String key) {
        this.raw = raw;
        this.ctorId = ctorId;
        this.key = key;
    }

    @Override
    public ReferenceType getType() {
        return ReferenceType.REQUEST_DATA;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    public Integer getCtorId() {
        return ctorId;
    }

    public String getKey() {
        return key;
    }

    /**
     * Parses a raw request data reference string into a {@link RequestDataReference}.
     *
     * <p>Expected syntax:
     * <pre>{@code
     * {key}
     * {#ctorId.key}
     * }</pre>
     *
     * @param rawReference raw request data reference
     * @return parsed {@link RequestDataReference}
     * @throws NullPointerException     if {@code rawReference} is {@code null}
     * @throws IllegalArgumentException if syntax is invalid, ctorId is malformed,
     *                                  or the key is empty
     */
    public static RequestDataReference parse(String rawReference) {
        Objects.requireNonNull(rawReference, "Request data reference is null");
        validate(rawReference);

        String content = rawReference.substring(1, rawReference.length() - 1);

        Integer ctorId = null;
        String key;

        if (content.startsWith("#")) {
            int dotIndex = content.indexOf('.');

            String idPart = content.substring(1, dotIndex);
            ctorId = Integer.valueOf(idPart);

            key = content.substring(dotIndex + 1);
        } else {
            key = content;
        }

        return new RequestDataReference(rawReference, ctorId, key);
    }

    private static void validate(String rawReference) {
        if (!rawReference.startsWith("{") || !rawReference.endsWith("}")) {
            throw new IllegalArgumentException("Invalid request data reference: " + rawReference);
        }

        if (rawReference.length() <= 2) {
            throw new IllegalArgumentException("Empty request data reference: " + rawReference);
        }

        String content = rawReference.substring(1, rawReference.length() - 1);

        if (content.startsWith("#")) {
            int dot = content.indexOf('.');
            if (dot <= 1 || dot == content.length() - 1) {
                throw new IllegalArgumentException("Invalid request data reference: " + rawReference);
            }

            for (int i = 1; i < dot; i++) {
                if (!Character.isDigit(content.charAt(i))) {
                    throw new IllegalArgumentException("Invalid ctorId in request data reference: " + rawReference);
                }
            }
        }
    }
}

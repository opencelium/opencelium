package com.becon.opencelium.backend.reference.model;

import java.util.Objects;

/**
 * Represents a request data reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * {<key>}
 * {#<ctorId>.<key>}
 * }</pre>
 *
 * <p>The {@code <ctorId>} is optional and refers to a specific connector, if it is not specified then we take current connector id.
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

    public static RequestDataReference parse(String s) {
        Objects.requireNonNull(s, "Request data reference is null");
        validate(s);

        // remove wrapper: {}
        String content = s.substring(1, s.length() - 1);

        Integer ctorId = null;
        String key;

        if (content.startsWith("#")) {
            int dot = content.indexOf('.');
            String idPart = content.substring(1, dot);
            ctorId = Integer.valueOf(idPart);
            key = content.substring(dot + 1);
        } else {
            key = content;
        }

        return new RequestDataReference(s, ctorId, key);
    }

    private static void validate(String s) {
        if (!s.startsWith("{") || !s.endsWith("}")) {
            throw new IllegalArgumentException("Invalid request data reference: " + s);
        }

        // exclude {%...%}
        if (s.startsWith("{%") && s.endsWith("%}")) {
            throw new IllegalArgumentException("Invalid request data reference: " + s);
        }

        if (s.length() <= 2) {
            throw new IllegalArgumentException("Empty request data reference: " + s);
        }

        String content = s.substring(1, s.length() - 1);

        if (content.startsWith("#")) {
            int dot = content.indexOf('.');
            if (dot <= 1 || dot == content.length() - 1) {
                throw new IllegalArgumentException("Invalid request data reference: " + s);
            }

            // validate ctorId
            for (int i = 1; i < dot; i++) {
                if (!Character.isDigit(content.charAt(i))) {
                    throw new IllegalArgumentException("Invalid ctorId in request data reference: " + s);
                }
            }
        }
    }
}

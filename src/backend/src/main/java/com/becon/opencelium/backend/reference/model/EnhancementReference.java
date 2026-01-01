package com.becon.opencelium.backend.reference.model;

import java.util.Objects;

/**
 * Represents an enhancement reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * #{%<hex-id>%}
 * }</pre>
 *
 * <p>The {@code <hex-id>} must be exactly 24 hexadecimal characters.
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

    public static EnhancementReference parse(String s) {
        Objects.requireNonNull(s, "Enhancement reference is null");
        validate(s);

        // strip '#{%'' and '%}'
        String bindId = s.substring(3, s.length() - 2);

        return new EnhancementReference(s, bindId);
    }

    private static void validate(String s) {
        // must be wrapped as #{%...%}
        if (!s.startsWith("#{%") || !s.endsWith("%}")) {
            throw new IllegalArgumentException("Invalid enhancement reference: " + s);
        }

        // #{%<24 hex>%} → total length must be 29
        if (s.length() != 29) {
            throw new IllegalArgumentException(
                    "Enhancement id must be exactly 24 hex characters: " + s
            );
        }

        // validate hex id
        for (int i = 3; i < 27; i++) {
            char c = s.charAt(i);
            if (Character.digit(c, 16) < 0) {
                throw new IllegalArgumentException(
                        "Invalid hex character '" + c + "' in enhancement reference: " + s
                );
            }
        }
    }
}

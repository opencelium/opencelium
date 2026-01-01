package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.ReferenceType;

import java.util.Objects;

/**
 * Represents a webhook reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * ${<expression>}
 * }</pre>
 *
 * <p>The inner expression is not validated here and may contain
 * json path and type hints.
 *
 * <p>Examples:
 * <pre>{@code
 * ${key}
 * ${key.field[*]}
 * ${key.field[*]:type}
 * }</pre>
 */
public final class WebhookReference implements Reference {

    private final String raw;
    private final String expression;

    private WebhookReference(String raw, String expression) {
        this.raw = raw;
        this.expression = expression;
    }

    @Override
    public ReferenceType getType() {
        return ReferenceType.WEBHOOK;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    public String getExpression() {
        return expression;
    }

    public static WebhookReference parse(String s) {
        Objects.requireNonNull(s, "Webhook reference is null");

        if (!s.startsWith("${") || !s.endsWith("}")) {
            throw new IllegalArgumentException("Invalid webhook reference: " + s);
        }

        if (s.length() <= 3) {
            throw new IllegalArgumentException("Empty webhook expression: " + s);
        }

        String expression = s.substring(2, s.length() - 1);

        return new WebhookReference(s, expression);
    }
}

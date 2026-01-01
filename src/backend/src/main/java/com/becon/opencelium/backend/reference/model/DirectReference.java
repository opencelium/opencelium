package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.ReferenceType;

import java.util.Objects;

/**
 * Represents a direct reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * #<operationId>.(response|request).(body|status|header)[.<path>]
 * }</pre>
 *
 * <p>The {@code <operationId>} consists of exactly 6 alphanumeric characters.
 */
public final class DirectReference implements Reference {

    private final String raw;
    private final String operationId;
    private final ExchangeType exchangeType;
    private final Part part;
    private final String path; // nullable (only for body/header)

    private DirectReference(
            String raw,
            String operationId,
            ExchangeType exchangeType,
            Part part,
            String path
    ) {
        this.raw = raw;
        this.operationId = operationId;
        this.exchangeType = exchangeType;
        this.part = part;
        this.path = path;
    }

    @Override
    public ReferenceType getType() {
        return ReferenceType.DIRECT;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    public String getOperationId() {
        return operationId;
    }

    public ExchangeType getExchangeType() {
        return exchangeType;
    }

    public Part getPart() {
        return part;
    }

    /**
     * Optional path (only for BODY and HEADER).
     * Returns {@code null} for STATUS.
     */
    public String getPath() {
        return path;
    }

    /**
     * Parses a direct reference.
     */
    public static DirectReference parse(String s) {
        Objects.requireNonNull(s, "Direct reference is null");
        validate(s);

        // operationId
        String operationId = s.substring(1, 7);

        int p = 7; // after operationId

        // skip ".("
        p += 2;

        // exchange
        ExchangeType exchangeType;
        if (s.startsWith("response)", p)) {
            exchangeType = ExchangeType.RESPONSE;
            p += "response)".length();
        } else {
            exchangeType = ExchangeType.REQUEST;
            p += "request)".length();
        }

        // skip '.'
        p++;

        // extract part
        Part part;
        if (s.startsWith("body", p)) {
            part = Part.BODY;
            p += 4;
        } else if (s.startsWith("status", p)) {
            part = Part.STATUS;
            p += 6;
        } else if (s.startsWith("header", p)) {
            part = Part.HEADER;
            p += 6;
        } else {
            throw new IllegalArgumentException("Invalid part in direct reference: " + s);
        }

        String path = null;

        // optional ".<path>"
        if (p < s.length()) {
            if (s.charAt(p) != '.') {
                throw new IllegalArgumentException("Invalid direct reference: " + s);
            }
            p++;
            path = s.substring(p);
        }

        return new DirectReference(s, operationId, exchangeType, part, path);
    }

    /**
     * Validates the grammar of a direct reference.
     */
    private static void validate(String s) {
        // minimal length: "#xxxxxx.(r).status"
        if (s.length() < 18) {
            throw new IllegalArgumentException("Invalid direct reference: " + s);
        }

        if (s.charAt(0) != '#') {
            throw new IllegalArgumentException("Invalid direct reference: " + s);
        }

        // operationId
        for (int i = 1; i <= 6; i++) {
            char c = s.charAt(i);
            if (!Character.isLetterOrDigit(c)) {
                throw new IllegalArgumentException("Invalid operationId in direct reference: " + s);
            }
        }

        int p = 7;

        if (s.charAt(p++) != '.' || s.charAt(p++) != '(') {
            throw new IllegalArgumentException("Invalid direct reference: " + s);
        }

        if (s.startsWith("response)", p)) {
            p += "response)".length();
        } else if (s.startsWith("request)", p)) {
            p += "request)".length();
        } else {
            throw new IllegalArgumentException("Invalid exchange type in direct reference: " + s);
        }

        if (p >= s.length() || s.charAt(p++) != '.') {
            throw new IllegalArgumentException("Invalid direct reference: " + s);
        }

        // validate part keyword
        if (s.startsWith("body", p)) {
            p += 4;
        } else if (s.startsWith("status", p)) {
            p += 6;
        } else if (s.startsWith("header", p)) {
            p += 6;
        } else {
            throw new IllegalArgumentException("Invalid part in direct reference: " + s);
        }

        // status must not have a path
        if (s.startsWith("status", p - 6) && p < s.length()) {
            throw new IllegalArgumentException("Status reference must not have a path: " + s);
        }

        // body/header may optionally have ".<path>"
        if (p < s.length() && s.charAt(p) != '.') {
            throw new IllegalArgumentException("Invalid direct reference: " + s);
        }
    }

    /**
     * Top-level part of a direct reference.
     */
    public enum Part {
        BODY,
        STATUS,
        HEADER
    }
}

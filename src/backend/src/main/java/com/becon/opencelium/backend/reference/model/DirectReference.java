package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.enums.ExchangeType;
import com.becon.opencelium.backend.reference.enums.ReferenceType;

import java.util.Objects;

public final class DirectReference implements Reference {

    private final String raw;
    private final String color;
    private final ExchangeType exchangeType;
    private final Part part;
    private final String path; // nullable, without "$."

    private DirectReference(
            String raw,
            String color,
            ExchangeType exchangeType,
            Part part,
            String path
    ) {
        this.raw = raw;
        this.color = color;
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

    public String getColor() {
        return color;
    }

    public ExchangeType getExchangeType() {
        return exchangeType;
    }

    public Part getPart() {
        return part;
    }

    public String getPath() {
        return path;
    }


    public static DirectReference parse(String rawReference) {
        Objects.requireNonNull(rawReference, "Direct reference is null");
        validate(rawReference);

        // '#ababab.(response).body.$.field[*]'
        // '#ababab.(request).body.$.field[*]'


        int p = 0;
        // color
        final String color = rawReference.substring(0, 7);
        p += 7; // skip "#abc123"

        // exchange type
        final ExchangeType exchangeType;
        if (rawReference.charAt(11) == 's') {
            exchangeType = ExchangeType.RESPONSE;
            p += 12; // skip ".(response)."
        } else {
            exchangeType = ExchangeType.REQUEST;
            p += 11; // skip ".(request)."
        }

        // exchange part
        final Part part;
        if (rawReference.charAt(p) == 'b') {
            part = Part.BODY;
            p += 4; // skip "body"
        } else if (rawReference.charAt(p) == 's') {
            part = Part.STATUS;
            p += 6; // skip "status"
        } else if (rawReference.charAt(p) == 'h') {
            part = Part.HEADER;
            p += 6; // skip "header"
        } else {
            part = Part.ALL;
            p += 3; // skip "[*]"
        }

        // path
        final String path;
        p += part == Part.ALL ? 1 : 3; // skip "." for Part.ALL or skip ".$." for other values of Part
        if (p < rawReference.length()) {
            path = rawReference.substring(p); // remove ".$."
        } else {
            path = null;
        }

        return new DirectReference(
                rawReference,
                color,
                exchangeType,
                part,
                path
        );
    }


    private static void validate(String rawReference) {
        // #ababab.(request).x - shortest possible case
        if (rawReference.length() < 19) {
            throw new IllegalArgumentException("Invalid direct reference: " + rawReference);
        }

        int p = 0;
        // color
        if (rawReference.charAt(p) != '#') {
            throw new IllegalArgumentException("Invalid color in direct reference: " + rawReference);
        }

        while (++p < 7) {
            char c = rawReference.charAt(p);
            if (!Character.isLetterOrDigit(c)) {
                throw new IllegalArgumentException("Invalid color in direct reference: " + rawReference);
            }
        }

        // exchange type
        if (rawReference.startsWith(".(response).", p)) {
            p += 12;
        } else if (rawReference.startsWith(".(request).", p)) {
            p += 11;
        } else {
            throw new IllegalArgumentException("Invalid exchange type in direct reference: " + rawReference);
        }

        // part
        if (rawReference.startsWith("status", p)) {
            if (rawReference.length() != p + 6) {
                throw new IllegalArgumentException("Status reference must not have a path: " + rawReference);
            }
            return;
        }

        if (rawReference.startsWith("body", p) || rawReference.startsWith("header", p) || rawReference.startsWith("[*]", p)) {
            return;
        }

        throw new IllegalArgumentException("Invalid part in direct reference: " + rawReference);
    }

    public enum Part {
        BODY,
        STATUS,
        HEADER,
        ALL // [*]
    }
}

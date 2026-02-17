package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.enums.ExchangeType;
import com.becon.opencelium.backend.reference.enums.ReferenceType;

import java.util.Objects;

import static com.becon.opencelium.backend.reference.enums.ReferenceType.DIRECT;

/**
 * Represents a direct reference to an operation request or response.
 *
 * <p><b>Syntax</b>:
 * <pre>{@code
 * #color.(response|request).(status|header|body|[*])[.<path>]
 * }</pre>
 *
 * <ul>
 *   <li>{@code color} – 6-character alphanumeric operation identifier</li>
 *   <li>{@code response|request} – exchange type</li>
 *   <li>{@code status|header|body|[*]} – part (exactly one)</li>
 *   <li>{@code path} – optional, JSONPath-like expression</li>
 * </ul>
 *
 * <p>The {@code path} part is <b>opaque</b> and is not validated syntactically.
 * It is interpreted later during extraction.
 *
 * <p><b>Selector rules</b>:
 * <ul>
 *   <li>{@code status} – returns HTTP status code (must NOT have a path)</li>
 *   <li>{@code header} – returns headers (path required)</li>
 *   <li>{@code body} – returns body (path required)</li>
 *   <li>{@code [*]} – selects all responses; any following segments are treated as path</li>
 * </ul>
 *
 * <p><b>Examples</b>:
 *
 * <pre>{@code
 * // CASE 1: collect all data
 * #ababab.(response).[*]
 * #ababab.(response).[*].status
 * #ababab.(response).[*].header
 * #ababab.(response).[*].body
 *
 * // CASE 2: status
 * #ababab.(response).status
 *
 * // CASE 3: header
 * #ababab.(response).header.$.Content-Type
 * #ababab.(request).header.$.Content-Type
 *
 * // CASE 4: body
 * #ababab.(response).body.$.field[*]
 * #ababab.(response).body.$.field1.['field2_with_special_symbol'].field3
 * #ababab.(response).body.$.[*]
 * #ababab.(request).body.$.[*]
 * }</pre>
 *
 * <p><b>Notes</b>:
 * <ul>
 *   <li>Only the first token after {@code (response|request).} is treated as a selector.</li>
 *   <li>Any subsequent segments are part of the {@code path}, even if they equal
 *       {@code status}, {@code header}, or {@code body}.</li>
 *   <li>All positional offsets and parsing rules are encapsulated in this class.</li>
 * </ul>
 */
public final class DirectReference implements Reference {
    private final String raw;
    private final String color;
    private final ExchangeType exchangeType;
    private final Part part;
    private final String path; // nullable

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
        return DIRECT;
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

    /**
     * Parses a raw direct reference string into a {@link DirectReference}.
     *
     * <p>Expected syntax:
     * <pre>{@code
     * #color.(response|request).(status|header|body|[*])[.<path>]
     * }</pre>
     *
     * @param rawReference raw direct reference
     * @return parsed {@link DirectReference}
     * @throws NullPointerException     if {@code rawReference} is {@code null}
     * @throws IllegalArgumentException if syntax is invalid, exchange type or part is invalid,
     *                                  or an illegal path is present
     */
    public static DirectReference parse(String rawReference) {
        Objects.requireNonNull(rawReference, "null is not a reference");
        validate(rawReference);

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
            throw new IllegalArgumentException(DIRECT + " reference must contain least 19 chars: " + rawReference);
        }

        int p = 0;
        // color
        if (rawReference.charAt(p) != '#') {
            throw new IllegalArgumentException("Invalid color for " + DIRECT + " reference: " + rawReference);
        }

        while (++p < 7) {
            char c = rawReference.charAt(p);
            if (!Character.isLetterOrDigit(c)) {
                throw new IllegalArgumentException("Invalid color for " + DIRECT + " reference: " + rawReference);
            }
        }

        // exchange type
        if (rawReference.startsWith(".(response).", p)) {
            p += 12;
        } else if (rawReference.startsWith(".(request).", p)) {
            p += 11;
        } else {
            throw new IllegalArgumentException("Invalid exchange type for " + DIRECT + " reference: " + rawReference);
        }

        // part
        if (rawReference.startsWith("status", p)) {
            if (rawReference.length() != p + 6) {
                throw new IllegalArgumentException(DIRECT + " reference with part = 'status' must not have a path: " + rawReference);
            }
            return;
        }

        if (rawReference.startsWith("body", p) || rawReference.startsWith("header", p) || rawReference.startsWith("[*]", p)) {
            return;
        }

        throw new IllegalArgumentException(DIRECT + " reference contains invalid part: " + rawReference);
    }

    public enum Part {
        BODY,
        STATUS,
        HEADER,
        ALL // [*]
    }
}

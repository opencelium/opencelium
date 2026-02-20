package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.reference.enums.ReferenceType;

import java.util.Objects;

import static com.becon.opencelium.backend.reference.enums.ReferenceType.WEBHOOK;

/**
 * Represents a webhook reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * ${path:dataType}
 * }</pre>
 *
 * <p>The inner expression contains json {@code path}, and optional {@code dataType} - type of targeted element by this {@code path}.
 *
 * <p>Examples:
 * <pre>{@code
 * ${key}
 * ${key.field[*]}
 * ${key.field[0].id:integer}
 * }</pre>
 */
public final class WebhookReference implements Reference {
    private final String raw;
    private final String path;
    private final DataType dataType;

    private WebhookReference(String raw, String path, DataType dataType) {
        this.raw = raw;
        this.path = path;
        this.dataType = dataType;
    }

    @Override
    public ReferenceType getType() {
        return WEBHOOK;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    public String getPath() {
        return path;
    }

    public DataType getDataType() {
        return dataType;
    }

    /**
     * Parses a raw webhook reference string into a {@link WebhookReference}.
     *
     * <p>Expected syntax:
     * <pre>{@code
     * ${path}
     * ${path:dataType}
     * }</pre>
     *
     * <p>The {@code path} represents a JSON path inside webhook variables.
     * The optional {@code dataType} defines how the extracted value should be cast.
     *
     * @param rawReference the raw webhook reference (must start with "${" and end with "}")
     * @return parsed {@link WebhookReference} containing path and optional data type
     * @throws NullPointerException     if {@code rawReference} is {@code null}
     * @throws IllegalArgumentException if the reference syntax is invalid,
     *                                  the path is empty, or the data type is unknown
     */
    public static WebhookReference parse(String rawReference) {
        Objects.requireNonNull(rawReference, "null is not a reference");
        validate(rawReference);

        final DataType dataType;
        final String path;

        int colonIndex = rawReference.lastIndexOf(':');
        if (colonIndex == -1) {
            // ${path}
            path = rawReference.substring(2, rawReference.length() - 1);
            dataType = DataType.UNDEFINED;
        } else {
            // ${path:type}
            path = rawReference.substring(2, colonIndex);
            dataType = DataType.fromString(
                    rawReference.substring(colonIndex + 1, rawReference.length() - 1)
            );
        }

        return new WebhookReference(rawReference, path, dataType);
    }

    private static void validate(String rawReference) {
        if (!rawReference.startsWith("${") || !rawReference.endsWith("}")) {
            throw new IllegalArgumentException("Invalid syntax for " + WEBHOOK + " reference: " + rawReference);
        }

        if (rawReference.length() <= 3) {
            throw new IllegalArgumentException("Empty key in " + WEBHOOK + " reference: " + rawReference);
        }
    }
}

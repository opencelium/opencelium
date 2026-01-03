package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.reference.enums.ReferenceType;

import java.util.Objects;

/**
 * Represents a pagination reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * @{pageParam}
 * }</pre>
 *
 * <p>Where {@code pageParam} is one of the supported pagination parameters
 * defined in {@link PageParam}.
 *
 * <p>Examples:
 * <pre>{@code
 * @{limit}
 * @{size}
 * }</pre>
 */
public final class PageReference implements Reference {
    private final String raw;
    private final PageParam pageParam;

    private PageReference(String raw, PageParam pageParam) {
        this.raw = raw;
        this.pageParam = pageParam;
    }

    @Override
    public ReferenceType getType() {
        return ReferenceType.PAGE;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    public PageParam getPageParam() {
        return pageParam;
    }

    /**
     * Parses a raw pagination reference.
     *
     * <p>Expected syntax:
     * <pre>{@code
     * @{pageParam}
     * }</pre>
     *
     * @param rawReference raw page reference (must start with "@{" and end with "}")
     * @return parsed {@link PageReference}
     * @throws NullPointerException     if {@code rawReference} is null
     * @throws IllegalArgumentException if syntax is invalid or param is unknown
     */

    public static PageReference parse(String rawReference) {
        Objects.requireNonNull(rawReference, "Page reference is null");
        validate(rawReference);

        String paramString = rawReference.substring(2, rawReference.length() - 1);
        PageParam pageParam = PageParam.fromString(paramString);

        return new PageReference(rawReference, pageParam);
    }

    private static void validate(String ref) {
        if (!ref.startsWith("@{") || !ref.endsWith("}")) {
            throw new IllegalArgumentException("Invalid page reference: " + ref);
        }

        if (ref.length() <= 3) {
            throw new IllegalArgumentException("Empty page parameter: " + ref);
        }
    }
}

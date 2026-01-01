package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.enums.PageParam;

import java.util.Objects;

/**
 * Represents a pagination reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * @{<param>}
 * }</pre>
 *
 * <p>Where {@code <param>} is one of the supported pagination parameters
 * defined in {@link PageParam}.
 *
 * <p>Examples:
 * <pre>{@code
 * @{limit}
 * @{size}
 * }</pre>
 */
public class PageReference implements Reference {
    private final String raw;
    private final PageParam param;

    private PageReference(String raw, PageParam param) {
        this.raw = raw;
        this.param = param;
    }

    @Override
    public ReferenceType getType() {
        return ReferenceType.PAGE;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    public PageParam getParam() {
        return param;
    }

    public static PageReference parse(String ref) {
        Objects.requireNonNull(ref, "Page reference is null");
        validate(ref);

        // remove wrapper: @{}
        String paramString = ref.substring(2, ref.length() - 1);
        PageParam param = PageParam.fromString(paramString);

        return new PageReference(ref, param);
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

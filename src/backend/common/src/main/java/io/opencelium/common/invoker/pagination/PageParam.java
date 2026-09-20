package io.opencelium.common.invoker.pagination;

import java.util.Arrays;

/** A quantity that takes part in paging, such as page size or position. */
public enum PageParam {

    /** How many results one page holds. */
    LIMIT("limit"),

    /** How many results to skip before this page. */
    OFFSET("offset"),

    /** Which page to fetch, for APIs that count pages rather than results. */
    PAGE("page"),

    /** How many results or pages exist in total. */
    SIZE("size"),

    /** Where the actual rows of a page are found. */
    RESULT("result"),

    SORT("sort"),

    ORDER("order"),

    CATEGORY("category"),

    /** A link or token pointing to the following page. */
    NEXT("next"),

    /** A link or token pointing to the preceding page. */
    PREV("prev"),

    /** A link header carrying navigation links, as in RFC 8288. */
    LINK("link"),

    /** A flag stating whether another page exists. */
    HAS_MORE("has_more"),

    /** An opaque position marker, for cursor-based APIs. */
    CURSOR("cursor");

    private final String value;

    PageParam(String value) {
        this.value = value;
    }

    /** The element name used in an invoker file, for example {@code has_more}. */
    public String value() {
        return value;
    }

    /**
     * Resolves a parameter from its element name in an invoker file, ignoring case.
     *
     * @throws IllegalArgumentException if the name is not a pagination parameter
     */
    public static PageParam fromValue(String value) {
        return Arrays.stream(values())
                .filter(param -> param.value.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("'" + value + "' is not a pagination parameter; "
                        + "expected one of " + Arrays.stream(values()).map(PageParam::value).toList()));
    }
}

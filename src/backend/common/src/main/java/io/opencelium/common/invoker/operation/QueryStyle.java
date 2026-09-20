package io.opencelium.common.invoker.operation;

import java.util.Arrays;

/**
 * How a query parameter holding a list or an object is written into the URL.
 *
 * <p>These are the styles OpenAPI 3.1 defines for query parameters. The rendering also depends on
 * {@link QueryParameter#explode()}; for a parameter {@code status} holding {@code open} and
 * {@code pending}:
 * <table>
 *   <caption>Rendering of a list parameter</caption>
 *   <tr><th>style</th><th>explode</th><th>query string</th></tr>
 *   <tr><td>form</td><td>true</td><td>{@code status=open&status=pending}</td></tr>
 *   <tr><td>form</td><td>false</td><td>{@code status=open,pending}</td></tr>
 *   <tr><td>spaceDelimited</td><td>false</td><td>{@code status=open%20pending}</td></tr>
 *   <tr><td>pipeDelimited</td><td>false</td><td>{@code status=open|pending}</td></tr>
 * </table>
 */
public enum QueryStyle {

    /** The default. Valid for every parameter type. */
    FORM("form"),

    /** Elements separated by a space. Lists only. */
    SPACE_DELIMITED("spaceDelimited"),

    /** Elements separated by {@code |}. Lists only. */
    PIPE_DELIMITED("pipeDelimited"),

    /** An object as {@code filter[status]=open&filter[owner]=me}. Objects only. */
    DEEP_OBJECT("deepObject");

    private final String value;

    QueryStyle(String value) {
        this.value = value;
    }

    /** The name used in an invoker file's {@code style} attribute, for example {@code deepObject}. */
    public String value() {
        return value;
    }

    /**
     * Resolves a style from its name, ignoring case.
     *
     * @throws IllegalArgumentException if the name is not a query style
     */
    public static QueryStyle fromValue(String value) {
        return Arrays.stream(values())
                .filter(style -> style.value.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("'" + value + "' is not a query parameter style; "
                        + "expected one of " + Arrays.stream(values()).map(QueryStyle::value).toList()));
    }
}

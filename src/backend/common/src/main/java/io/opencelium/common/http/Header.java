package io.opencelium.common.http;

/**
 * One HTTP header: a name and, optionally, a value.
 *
 * <p>The value may be absent when a header is <em>described</em> rather than sent, for example a
 * {@code Location} header an operation is known to return. It may also contain placeholders such
 * as {@code Bearer {token}}; those are resolved at execution time, not here.
 *
 * <p>Header names are case-insensitive (RFC 9110 §5.1), so compare them with {@link #hasName}
 * rather than {@code equals}. The name is kept exactly as written, because some servers are less
 * forgiving than the standard.
 */
public record Header(String name, String value) {

    public static Header of(String name, String value) {
        return new Header(name, value);
    }

    public boolean hasName(String other) {
        return name.equalsIgnoreCase(other);
    }
}

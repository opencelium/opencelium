package io.opencelium.common.http;

import org.jspecify.annotations.Nullable;

import java.util.Objects;
import java.util.regex.Pattern;

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
public record Header(String name, @Nullable String value) {

    /** The standard name of the header that states a body's media type. */
    public static final String CONTENT_TYPE = "Content-Type";

    /** A field name is a {@code token} as defined in RFC 9110 §5.6.2. */
    private static final Pattern TOKEN = Pattern.compile("[!#$%&'*+\\-.^_`|~0-9A-Za-z]+");

    public Header {
        Objects.requireNonNull(name, "header name must not be null");
        if (!TOKEN.matcher(name).matches()) {
            throw new IllegalArgumentException("'" + name + "' is not a valid header name; "
                    + "a header name cannot be empty or contain spaces, colons or quotes");
        }
    }

    public static Header of(String name, @Nullable String value) {
        return new Header(name, value);
    }

    /** Whether this header has the given name, compared without regard to case. */
    public boolean hasName(String other) {
        return name.equalsIgnoreCase(other);
    }
}

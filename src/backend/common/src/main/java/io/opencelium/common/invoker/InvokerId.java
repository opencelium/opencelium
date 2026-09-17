package io.opencelium.common.invoker;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * The permanent identifier of an invoker.
 *
 * <p>Connectors are stored against this id, so it must never change once connectors use it. The
 * invoker's display name is separate and free to change.
 *
 * <p>An id is lower-case letters and digits in hyphen-separated groups, such as
 * {@code example-service-desk}. A UUID also has that form, so the rule holds whether ids end up
 * authored or generated.
 */
public record InvokerId(String value) {

    private static final int MAX_LENGTH = 100;
    private static final Pattern FORMAT = Pattern.compile("[a-z0-9]+(?:-[a-z0-9]+)*");

    public InvokerId {
        Objects.requireNonNull(value, "invoker id must not be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("invoker id must not be blank");
        }
        if (value.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("invoker id must not exceed " + MAX_LENGTH + " characters");
        }
        if (!FORMAT.matcher(value).matches()) {
            throw new IllegalArgumentException("'" + value + "' is not a valid invoker id; use lower-case letters "
                    + "and digits, optionally separated by single hyphens, for example example-service-desk");
        }
    }

    public static InvokerId of(String value) {
        return new InvokerId(value);
    }

    @Override
    public String toString() {
        return value;
    }
}

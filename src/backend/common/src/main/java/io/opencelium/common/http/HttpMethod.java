package io.opencelium.common.http;

import java.util.Arrays;
import java.util.Locale;

/**
 * An HTTP request method: those defined in RFC 9110 §9.3, plus {@code PATCH} from RFC 5789.
 *
 * <p>{@code CONNECT} and {@code TRACE} are left out deliberately. Neither has a use when calling an
 * API, and {@code TRACE} is routinely disabled by servers for security reasons.
 */
public enum HttpMethod {

    GET,
    HEAD,
    POST,
    PUT,
    PATCH,
    DELETE,
    OPTIONS;

    /**
     * Resolves a method by name, ignoring case, so {@code "get"} and {@code "GET"} are the same.
     *
     * @throws IllegalArgumentException if the name is not one of the supported methods
     */
    public static HttpMethod fromValue(String value) {
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(method -> method.name().equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "unsupported HTTP method '" + value + "'; expected one of " + Arrays.toString(values())));
    }
}

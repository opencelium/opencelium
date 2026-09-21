package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.Header;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * What an operation sends.
 *
 * <p>In an invoker file:
 * <pre>{@code
 * <request>
 *     <method>GET</method>
 *     <endpoint>{url}/tickets/{ticketId}</endpoint>
 *     <header>
 *         <item name="Authorization">Bearer {sessionToken}</item>
 *     </header>
 *     <parameters>
 *         <parameter name="expand" type="string">comments</parameter>
 *     </parameters>
 * </request>
 * }</pre>
 *
 * <p>The endpoint is a template: {@code {url}} and other placeholders are filled in at execution
 * time. It must not contain a query string; query parameters are declared as {@link #parameters()}
 * so they have a name, a type and a default.
 *
 * @param method     the HTTP method
 * @param endpoint   the URL template, without a query string
 * @param headers    request headers; must not include {@code Content-Type}
 * @param parameters query parameters, with unique names
 * @param body       the payload, or {@code null} for a request without one
 */
public record Request(
        String method,
        String endpoint,
        List<Header> headers,
        List<QueryParameter> parameters,
        Body body) {

    public Request {
        Objects.requireNonNull(method, "request method must not be null");
        Objects.requireNonNull(endpoint, "request endpoint must not be null");
        Objects.requireNonNull(parameters, "request parameters must not be null");
        if (endpoint.isBlank()) {
            throw new IllegalArgumentException("request endpoint must not be blank");
        }
        int query = endpoint.indexOf('?');
        if (query >= 0) {
            throw new IllegalArgumentException("request endpoint '" + endpoint + "' contains a query string; "
                    + "declare '" + endpoint.substring(query + 1) + "' as parameters instead");
        }
        parameters = List.copyOf(parameters);
        Set<String> seen = new HashSet<>();
        for (QueryParameter parameter : parameters) {
            if (!seen.add(parameter.name())) {
                throw new IllegalArgumentException("query parameter '" + parameter.name()
                        + "' is declared more than once");
            }
        }
    }

    /** A request with no headers, parameters or body. */
    public static Request of(String method, String endpoint) {
        return new Request(method, endpoint, List.of(), List.of(), null);
    }
}

package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.Header;
import io.opencelium.common.http.HttpMethod;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
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
        HttpMethod method,
        String endpoint,
        List<Header> headers,
        List<QueryParameter> parameters,
        @Nullable Body body) {

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
        headers = Headers.copyOf(headers, "request");
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
    public static Request of(HttpMethod method, String endpoint) {
        return new Request(method, endpoint, List.of(), List.of(), null);
    }

    /** The first header with this name, compared without regard to case. */
    public Optional<Header> header(String name) {
        return Headers.find(headers, name);
    }

    /** The query parameter with exactly this name. */
    public Optional<QueryParameter> parameter(String name) {
        return parameters.stream().filter(parameter -> parameter.name().equals(name)).findFirst();
    }

    /** Starts a request with its method and endpoint template. */
    public static Builder builder(HttpMethod method, String endpoint) {
        return new Builder(method, endpoint);
    }

    /**
     * Collects the parts of a request. {@link #build()} applies every rule of the {@link Request}
     * constructor.
     */
    public static final class Builder {

        private final HttpMethod method;
        private final String endpoint;
        private final List<Header> headers = new ArrayList<>();
        private final List<QueryParameter> parameters = new ArrayList<>();
        private @Nullable Body body;

        private Builder(HttpMethod method, String endpoint) {
            this.method = method;
            this.endpoint = endpoint;
        }

        public Builder header(Header header) {
            headers.add(Objects.requireNonNull(header, "header must not be null"));
            return this;
        }

        public Builder header(String name, @Nullable String value) {
            return header(Header.of(name, value));
        }

        public Builder headers(Collection<Header> headers) {
            headers.forEach(this::header);
            return this;
        }

        public Builder parameter(QueryParameter parameter) {
            parameters.add(Objects.requireNonNull(parameter, "query parameter must not be null"));
            return this;
        }

        public Builder parameters(Collection<QueryParameter> parameters) {
            parameters.forEach(this::parameter);
            return this;
        }

        public Builder body(@Nullable Body body) {
            this.body = body;
            return this;
        }

        /**
         * @throws IllegalArgumentException if the parts break a rule of {@link Request}
         */
        public Request build() {
            return new Request(method, endpoint, headers, parameters, body);
        }
    }
}

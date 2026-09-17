package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.Header;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * One outcome an operation can return, selected by status code.
 *
 * <p>In an invoker file:
 * <pre>{@code
 * <response status="201">
 *     <header>
 *         <item name="Location"/>
 *     </header>
 *     <body contentType="application/json"> … </body>
 * </response>
 *
 * <response status="204"/>   <!-- no body -->
 * }</pre>
 *
 * @param status    which status codes this response covers
 * @param condition decides success when the status cannot, or {@code null} to trust the status
 * @param headers   headers worth binding to, such as {@code Location}; must not include
 *                  {@code Content-Type}
 * @param body      the payload, or {@code null} when the response has none
 */
public record Response(
        ResponseStatus status,
        @Nullable SuccessCondition condition,
        List<Header> headers,
        @Nullable Body body) {

    public Response {
        Objects.requireNonNull(status, "response status must not be null");
        headers = Headers.copyOf(headers, "response " + status.value());
    }

    /** A response with no condition, no headers and no body, such as {@code 204 No Content}. */
    public static Response of(ResponseStatus status) {
        return new Response(status, null, List.of(), null);
    }

    /** A response with no condition and no headers. */
    public static Response of(ResponseStatus status, @Nullable Body body) {
        return new Response(status, null, List.of(), body);
    }

    /** The first header with this name, compared without regard to case. */
    public Optional<Header> header(String name) {
        return Headers.find(headers, name);
    }

    /** Starts a response for the status codes it covers. */
    public static Builder builder(ResponseStatus status) {
        return new Builder(status);
    }

    /**
     * Collects the parts of a response. {@link #build()} applies every rule of the {@link Response}
     * constructor.
     */
    public static final class Builder {

        private final ResponseStatus status;
        private @Nullable SuccessCondition condition;
        private final List<Header> headers = new ArrayList<>();
        private @Nullable Body body;

        private Builder(ResponseStatus status) {
            this.status = status;
        }

        /** Decides success from the body, for APIs whose status code cannot, such as {@code body.error == null}. */
        public Builder successWhen(String expression) {
            return condition(SuccessCondition.of(expression));
        }

        /** Sets the success condition; {@code null} trusts the status code. */
        public Builder condition(@Nullable SuccessCondition condition) {
            this.condition = condition;
            return this;
        }

        public Builder header(Header header) {
            headers.add(Objects.requireNonNull(header, "header must not be null"));
            return this;
        }

        /** Describes a header the response carries; its value is usually unknown in advance. */
        public Builder header(String name) {
            return header(Header.of(name, null));
        }

        public Builder headers(Collection<Header> headers) {
            headers.forEach(this::header);
            return this;
        }

        public Builder body(@Nullable Body body) {
            this.body = body;
            return this;
        }

        /**
         * @throws IllegalArgumentException if the parts break a rule of {@link Response}
         */
        public Response build() {
            return new Response(status, condition, headers, body);
        }
    }
}

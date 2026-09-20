package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.Header;

import java.util.List;
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
        SuccessCondition condition,
        List<Header> headers,
        Body body) {

    /** A response with no condition, no headers and no body, such as {@code 204 No Content}. */
    public static Response of(ResponseStatus status) {
        return new Response(status, null, List.of(), null);
    }

    /** A response with no condition and no headers. */
    public static Response of(ResponseStatus status, Body body) {
        return new Response(status, null, List.of(), body);
    }

    /** The first header with this name, compared without regard to case. */
    public Optional<Header> header(String name) {
        return Headers.find(headers, name);
    }
}

package com.becon.opencelium.backend.resource.connection.methodtest;

import java.util.List;
import java.util.Map;

/**
 * Result of {@code POST /connection/method/test}.
 *
 * <p>Either the request was sent, and {@code request}, {@code response} and {@code durationMs}
 * are set, or the data of a connector could not be read, and only {@code connectorErrors} is set.
 *
 * @param request the request as sent, with the connectors' non-public values masked
 * @param response the response of the API, including error statuses
 * @param durationMs how long the API took to answer
 * @param connectorErrors why the data of a connector could not be read; empty once sent
 */
public record MethodTestResultDTO(
        SentRequest request,
        ReceivedResponse response,
        Long durationMs,
        List<ConnectorError> connectorErrors) {

    public MethodTestResultDTO {
        connectorErrors = connectorErrors == null ? List.of() : List.copyOf(connectorErrors);
    }

    /** Returns the result of a request that was sent and answered. */
    public static MethodTestResultDTO sent(
            SentRequest request, ReceivedResponse response, long durationMs) {
        return new MethodTestResultDTO(request, response, durationMs, List.of());
    }

    /** Returns the result of a request that was not sent because connector data is missing. */
    public static MethodTestResultDTO notSent(List<ConnectorError> connectorErrors) {
        return new MethodTestResultDTO(null, null, null, connectorErrors);
    }

    /**
     * The request as sent.
     *
     * @param body the payload as text, or the fields of a form; {@code null} without a body
     */
    public record SentRequest(
            String method, String url, Map<String, List<String>> headers, Object body) {}

    /**
     * The response of the API.
     *
     * @param body the payload: parsed JSON, text, or Base64 for binary content
     */
    public record ReceivedResponse(int status, Map<String, List<String>> headers, Object body) {}

    /** A connector whose data could not be read, e.g. because its authentication call failed. */
    public record ConnectorError(int connectorId, String message) {}
}

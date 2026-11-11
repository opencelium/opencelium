package com.becon.opencelium.backend.execution;

import static com.becon.opencelium.backend.utility.MediaTypeUtility.isBinaryCompatible;
import static com.becon.opencelium.backend.utility.MediaTypeUtility.isJsonCompatible;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import java.net.URI;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

/**
 * Sends the request of a single operation and returns the response, whatever happens.
 *
 * <p>Shared by the connection execution ({@link ConnectorExecutor}) and the single-method test,
 * so both read the response with the same type and report failures the same way.
 */
public final class OperationExchange {

    private OperationExchange() {}

    /**
     * Returns the Java type the response body of {@code operation} should be read into.
     *
     * <p>The media type comes from the operation's {@code success} response and defaults to JSON:
     * JSON is read into {@link Object}, binary content into {@code byte[]}, anything else into
     * {@link String}.
     */
    public static Class<?> responseTypeOf(OperationDTO operation) {
        MediaType mediaType = MediaType.APPLICATION_JSON;
        for (ResponseDTO response : operation.getResponses()) {
            if ("success".equals(response.getStatus())) {
                mediaType = response.getContent();
            }
        }

        if (isJsonCompatible(mediaType)) {
            return Object.class;
        } else if (isBinaryCompatible(mediaType)) {
            return byte[].class;
        } else {
            return String.class;
        }
    }

    /**
     * Sends {@code request} to {@code uri} and returns the response.
     *
     * <p>Never throws on a failed call: an error status, an unreachable host or any other client
     * failure is returned as a response, so the caller can report it like a regular response.
     */
    public static ResponseEntity<?> exchange(
            RestTemplate restTemplate, URI uri, RequestEntity<?> request, Class<?> responseType) {
        HttpEntity<Object> httpEntity = new HttpEntity<>(request.getBody(), request.getHeaders());

        try {
            return restTemplate.exchange(uri, request.getMethod(), httpEntity, responseType);
        } catch (Exception e) {
            return toResponse(e);
        }
    }

    private static ResponseEntity<?> toResponse(Exception e) {
        if (e instanceof RestClientResponseException rre) { // 4xx - 5xx
            HttpHeaders headers =
                    rre.getResponseHeaders() != null ? rre.getResponseHeaders() : new HttpHeaders();

            return ResponseEntity.status(rre.getStatusCode())
                    .headers(headers)
                    .body(rre.getResponseBodyAsString());
        }

        if (e instanceof ResourceAccessException rae) {
            Throwable root = rae.getMostSpecificCause();

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Connection error: " + (root != null ? root.getMessage() : rae.getMessage()));
        }

        if (e instanceof RestClientException rce) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Client error: " + rce.getMessage());
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.TEXT_PLAIN)
                .body("Unexpected error: " + e.getMessage());
    }
}

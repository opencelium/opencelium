package com.becon.opencelium.backend.unit.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.execution.OperationExchange;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import java.net.ConnectException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Unit tests for {@link OperationExchange}. The HTTP client is mocked.
 */
@DisplayName("OperationExchange — unit")
@ExtendWith(MockitoExtension.class)
class OperationExchangeTest {

    private static final URI ORDERS = URI.create("http://api.test/orders");

    @Mock
    RestTemplate restTemplate;

    // ── responseTypeOf ────────────────────────────────────────────────────────

    @Test
    void responseTypeOfReturnsObjectWhenSuccessResponseIsJson() {
        OperationDTO operation = anOperationAnswering(response("success", MediaType.APPLICATION_JSON));

        assertThat(OperationExchange.responseTypeOf(operation)).isEqualTo(Object.class);
    }

    @Test
    void responseTypeOfReturnsByteArrayWhenSuccessResponseIsBinary() {
        OperationDTO operation = anOperationAnswering(response("success", MediaType.APPLICATION_OCTET_STREAM));

        assertThat(OperationExchange.responseTypeOf(operation)).isEqualTo(byte[].class);
    }

    @Test
    void responseTypeOfReturnsStringWhenSuccessResponseIsText() {
        OperationDTO operation = anOperationAnswering(response("success", MediaType.TEXT_PLAIN));

        assertThat(OperationExchange.responseTypeOf(operation)).isEqualTo(String.class);
    }

    @Test
    @DisplayName("responseTypeOf — only the success response counts; without one the body is read as JSON")
    void responseTypeOfReturnsObjectWhenNoSuccessResponseIsDefined() {
        OperationDTO operation = anOperationAnswering(response("fail", MediaType.TEXT_PLAIN));

        assertThat(OperationExchange.responseTypeOf(operation)).isEqualTo(Object.class);
    }

    // ── exchange ──────────────────────────────────────────────────────────────

    @Test
    void exchangeReturnsApiResponseWhenCallSucceeds() {
        when(restTemplate.exchange(eq(ORDERS), eq(HttpMethod.GET), any(HttpEntity.class), eq(Object.class)))
                .thenReturn(ResponseEntity.ok(Map.of("id", 7)));

        ResponseEntity<?> response = OperationExchange.exchange(restTemplate, ORDERS, aGet(), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("id", 7));
    }

    @Test
    @SuppressWarnings("unchecked")
    void exchangeForwardsRequestEntityWhenCallIsMade() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Trace", "abc");
        RequestEntity<String> request = new RequestEntity<>("{\"name\":\"box\"}", headers, HttpMethod.POST, ORDERS);
        when(restTemplate.exchange(eq(ORDERS), eq(HttpMethod.POST), any(HttpEntity.class), eq(Object.class)))
                .thenReturn(ResponseEntity.ok().build());

        OperationExchange.exchange(restTemplate, ORDERS, request, Object.class);

        ArgumentCaptor<HttpEntity<Object>> sent = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(eq(ORDERS), eq(HttpMethod.POST), sent.capture(), eq(Object.class));
        assertThat(sent.getValue().getBody()).isEqualTo("{\"name\":\"box\"}");
        assertThat(sent.getValue().getHeaders().getFirst("X-Trace")).isEqualTo("abc");
    }

    @Test
    void exchangeReturnsErrorResponseWhenApiAnswersWithErrorStatus() {
        when(restTemplate.exchange(eq(ORDERS), eq(HttpMethod.GET), any(HttpEntity.class), eq(Object.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.NOT_FOUND, "Not Found", new HttpHeaders(),
                        "missing".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));

        ResponseEntity<?> response = OperationExchange.exchange(restTemplate, ORDERS, aGet(), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isEqualTo("missing");
    }

    @Test
    void exchangeReturnsServiceUnavailableWhenHostIsUnreachable() {
        when(restTemplate.exchange(eq(ORDERS), eq(HttpMethod.GET), any(HttpEntity.class), eq(Object.class)))
                .thenThrow(new ResourceAccessException("I/O error", new ConnectException("Connection refused")));

        ResponseEntity<?> response = OperationExchange.exchange(restTemplate, ORDERS, aGet(), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isEqualTo("Connection error: Connection refused");
    }

    @Test
    void exchangeReturnsInternalErrorWhenClientFails() {
        when(restTemplate.exchange(eq(ORDERS), eq(HttpMethod.GET), any(HttpEntity.class), eq(Object.class)))
                .thenThrow(new RestClientException("no converter"));

        ResponseEntity<?> response = OperationExchange.exchange(restTemplate, ORDERS, aGet(), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isEqualTo("Client error: no converter");
    }

    @Test
    void exchangeReturnsInternalErrorWhenUnexpectedExceptionOccurs() {
        when(restTemplate.exchange(eq(ORDERS), eq(HttpMethod.GET), any(HttpEntity.class), eq(Object.class)))
                .thenThrow(new IllegalStateException("odd state"));

        ResponseEntity<?> response = OperationExchange.exchange(restTemplate, ORDERS, aGet(), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isEqualTo("Unexpected error: odd state");
    }

    private static RequestEntity<Void> aGet() {
        return RequestEntity.get(ORDERS).build();
    }

    private static OperationDTO anOperationAnswering(ResponseDTO response) {
        OperationDTO operation = new OperationDTO();
        operation.setResponses(List.of(response));
        return operation;
    }

    private static ResponseDTO response(String status, MediaType content) {
        ResponseDTO response = new ResponseDTO();
        response.setStatus(status);
        response.setContent(content);
        return response;
    }
}

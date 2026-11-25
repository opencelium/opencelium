package com.becon.opencelium.backend.unit.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.execution.OperationExchange;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ResponseDTO;
import com.becon.opencelium.backend.testutil.fake.FakeHttpServer;
import com.becon.opencelium.backend.testutil.fake.FakeHttpServer.RecordedRequest;
import java.net.ConnectException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Unit tests for {@link OperationExchange}.
 *
 * <p>What the API answers comes from a {@link FakeHttpServer}, called through a client built like
 * the one a run uses, so a response is read by the real client. Only the request sent for a text
 * response and the failures no server can produce use a mocked client.
 */
@DisplayName("OperationExchange — unit")
@ExtendWith(MockitoExtension.class)
class OperationExchangeTest {

    private static final URI ORDERS = URI.create("http://api.test/orders");

    @Mock
    RestTemplate restTemplate;

    private final RestTemplate client = new RestTemplateBuilder(new RestCustomizer()).build();
    private FakeHttpServer api;
    private URI orders;

    @BeforeEach
    void startApi() {
        api = FakeHttpServer.start();
        orders = URI.create(api.baseUrl() + "/orders");
    }

    @AfterEach
    void stopApi() {
        api.close();
    }

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

    // ── exchange: what the API answers ────────────────────────────────────────

    @Test
    void exchangeReturnsParsedJsonWhenBodyIsJson() {
        api.respondWith(200, "application/json", "{\"id\":7}");

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aGet(orders), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("id", 7));
    }

    @Test
    @DisplayName("exchange — a webhook answering 200 'ok' as text/html is a success, not a client error")
    void exchangeReturnsTextWithRealStatusWhenBodyIsNotJson() {
        api.respondWith(200, "text/html", "ok");

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aJsonPost(orders), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_HTML);
        assertThat(response.getBody()).isEqualTo("ok");
    }

    @Test
    void exchangeParsesJsonWhenContentTypeIsNotJson() {
        api.respondWith(200, "text/html", "{\"id\":7}");

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aGet(orders), Object.class);

        assertThat(response.getBody()).isEqualTo(Map.of("id", 7));
    }

    @Test
    void exchangeReturnsNullBodyWhenResponseIsEmpty() {
        api.respondWith(200, "text/html", "");

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aGet(orders), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void exchangeReturnsNumberWhenBodyIsJsonScalar() {
        api.respondWith(200, "text/plain", "1");

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aGet(orders), Object.class);

        assertThat(response.getBody()).isEqualTo(1);
    }

    @Test
    @DisplayName("exchange — a success whose JSON is cut off keeps its status and is returned as text")
    void exchangeReturnsTextWhenJsonBodyIsMalformed() {
        api.respondWith(200, "application/json", "{\"id\":");

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aGet(orders), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("{\"id\":");
    }

    @Test
    void exchangeParsesJsonWhenCharsetIsNotUnicode() {
        api.respondWith(
                200,
                "application/json; charset=ISO-8859-1",
                "{\"name\":\"Müller\"}".getBytes(StandardCharsets.ISO_8859_1));

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aGet(orders), Object.class);

        assertThat(response.getBody()).isEqualTo(Map.of("name", "Müller"));
    }

    @Test
    void exchangeDecodesTextWhenCharsetIsNotUnicode() {
        api.respondWith(
                200, "text/plain; charset=ISO-8859-1", "grüß dich".getBytes(StandardCharsets.ISO_8859_1));

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aGet(orders), Object.class);

        assertThat(response.getBody()).isEqualTo("grüß dich");
    }

    @Test
    void exchangeReturnsErrorResponseWhenApiAnswersWithErrorStatus() {
        api.respondWith(400, "text/html", "invalid_payload");

        ResponseEntity<?> response = OperationExchange.exchange(client, orders, aJsonPost(orders), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_HTML);
        assertThat(response.getBody()).isEqualTo("invalid_payload");
    }

    // ── exchange: the request ─────────────────────────────────────────────────

    @Test
    @DisplayName("exchange — a JSON response is asked for as JSON, although its body is read raw")
    void exchangeSendsJsonAcceptHeaderWhenJsonIsExpected() {
        OperationExchange.exchange(client, orders, aGet(orders), Object.class);

        assertThat(api.requests()).hasSize(1);
        assertThat(api.requests().get(0).header("Accept")).startsWith("application/json");
    }

    @Test
    void exchangeForwardsRequestEntityWhenCallIsMade() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Trace", "abc");
        RequestEntity<String> request = new RequestEntity<>("{\"name\":\"box\"}", headers, HttpMethod.POST, orders);

        OperationExchange.exchange(client, orders, request, Object.class);

        assertThat(api.requests()).extracting(RecordedRequest::method).containsExactly("POST");
        assertThat(api.requests()).extracting(RecordedRequest::body).containsExactly("{\"name\":\"box\"}");
        assertThat(api.requests()).extracting(sent -> sent.header("X-Trace")).containsExactly("abc");
    }

    @Test
    @SuppressWarnings("unchecked")
    void exchangeDeclaresUtf8WhenTextBodyHasContentTypeWithoutCharset() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_XML);
        headers.add("X-Trace", "abc");
        RequestEntity<String> request = new RequestEntity<>("<v>é</v>", headers, HttpMethod.POST, ORDERS);
        when(restTemplate.exchange(eq(ORDERS), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok().build());

        OperationExchange.exchange(restTemplate, ORDERS, request, String.class);

        ArgumentCaptor<HttpEntity<Object>> sent = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(eq(ORDERS), eq(HttpMethod.POST), sent.capture(), eq(String.class));
        assertThat(sent.getValue().getHeaders().getContentType())
                .isEqualTo(new MediaType(MediaType.APPLICATION_XML, StandardCharsets.UTF_8));
        assertThat(sent.getValue().getHeaders().getFirst("X-Trace")).isEqualTo("abc");
    }

    @Test
    @SuppressWarnings("unchecked")
    void exchangeKeepsContentTypeWhenBodyIsJsonOrCharsetIsGiven() {
        HttpHeaders json = new HttpHeaders();
        json.setContentType(MediaType.APPLICATION_JSON);
        HttpHeaders latin1 = new HttpHeaders();
        latin1.setContentType(new MediaType(MediaType.TEXT_PLAIN, StandardCharsets.ISO_8859_1));
        when(restTemplate.exchange(eq(ORDERS), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok().build());

        OperationExchange.exchange(restTemplate, ORDERS, new RequestEntity<>("{}", json, HttpMethod.POST, ORDERS), String.class);
        OperationExchange.exchange(restTemplate, ORDERS, new RequestEntity<>("é", latin1, HttpMethod.POST, ORDERS), String.class);

        ArgumentCaptor<HttpEntity<Object>> sent = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(2))
                .exchange(eq(ORDERS), eq(HttpMethod.POST), sent.capture(), eq(String.class));
        assertThat(sent.getAllValues().get(0).getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        assertThat(sent.getAllValues().get(1).getHeaders().getContentType())
                .isEqualTo(new MediaType(MediaType.TEXT_PLAIN, StandardCharsets.ISO_8859_1));
    }

    // ── exchange: failed calls ────────────────────────────────────────────────

    @Test
    void exchangeReturnsServiceUnavailableWhenHostIsUnreachable() {
        when(restTemplate.execute(eq(ORDERS), eq(HttpMethod.GET), any(), any()))
                .thenThrow(new ResourceAccessException("I/O error", new ConnectException("Connection refused")));

        ResponseEntity<?> response = OperationExchange.exchange(restTemplate, ORDERS, aGet(ORDERS), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isEqualTo("Connection error: Connection refused");
    }

    @Test
    void exchangeReturnsInternalErrorWhenClientFails() {
        when(restTemplate.execute(eq(ORDERS), eq(HttpMethod.GET), any(), any()))
                .thenThrow(new RestClientException("no converter"));

        ResponseEntity<?> response = OperationExchange.exchange(restTemplate, ORDERS, aGet(ORDERS), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isEqualTo("Client error: no converter");
    }

    @Test
    void exchangeReturnsInternalErrorWhenUnexpectedExceptionOccurs() {
        when(restTemplate.execute(eq(ORDERS), eq(HttpMethod.GET), any(), any()))
                .thenThrow(new IllegalStateException("odd state"));

        ResponseEntity<?> response = OperationExchange.exchange(restTemplate, ORDERS, aGet(ORDERS), Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isEqualTo("Unexpected error: odd state");
    }

    private static RequestEntity<Void> aGet(URI uri) {
        return RequestEntity.get(uri).build();
    }

    private static RequestEntity<String> aJsonPost(URI uri) {
        return RequestEntity.post(uri).contentType(MediaType.APPLICATION_JSON).body("{\"text\":\"hi\"}");
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

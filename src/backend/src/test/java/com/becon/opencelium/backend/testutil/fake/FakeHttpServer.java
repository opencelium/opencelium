package com.becon.opencelium.backend.testutil.fake;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-process HTTP server standing in for an external API.
 *
 * <p>Listens on a free loopback port, records every request and answers each one with the
 * configured response: 200 with an empty JSON object until {@link #respondWith} changes it.
 * The answer is sent after the request is recorded, so a synchronous client can assert on
 * {@link #requests()} as soon as its call returns.
 */
public final class FakeHttpServer implements AutoCloseable {

    private final HttpServer server;
    private final List<RecordedRequest> requests = new CopyOnWriteArrayList<>();
    private volatile Answer answer =
            new Answer(200, "application/json", "{}".getBytes(StandardCharsets.UTF_8));

    private FakeHttpServer(HttpServer server) {
        this.server = server;
    }

    public static FakeHttpServer start() {
        try {
            HttpServer server =
                    HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
            FakeHttpServer fake = new FakeHttpServer(server);
            server.createContext("/", fake::handle);
            server.start();
            return fake;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Returns {@code http://<loopback address>:<port>}, without a trailing slash. */
    public String baseUrl() {
        InetSocketAddress address = server.getAddress();
        return "http://" + address.getAddress().getHostAddress() + ":" + address.getPort();
    }

    public void respondWith(int status, String contentType, String body) {
        respondWith(status, contentType, body.getBytes(StandardCharsets.UTF_8));
    }

    public void respondWith(int status, String contentType, byte[] body) {
        answer = new Answer(status, contentType, body.clone());
    }

    /** Returns the requests received so far, oldest first. */
    public List<RecordedRequest> requests() {
        return List.copyOf(requests);
    }

    @Override
    public void close() {
        server.stop(0);
    }

    private void handle(HttpExchange exchange) throws IOException {
        Map<String, List<String>> headers = new LinkedHashMap<>();
        exchange.getRequestHeaders().forEach((name, values) ->
                headers.put(name.toLowerCase(Locale.ROOT), List.copyOf(values)));
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        requests.add(new RecordedRequest(
                exchange.getRequestMethod(), exchange.getRequestURI().toString(), headers, body));

        Answer current = answer;
        exchange.getResponseHeaders().set("Content-Type", current.contentType());
        exchange.sendResponseHeaders(current.status(), current.body().length == 0 ? -1 : current.body().length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(current.body());
        }
    }

    /**
     * A request as the server received it.
     *
     * @param uri path and query, e.g. {@code /orders?status=open}
     * @param headers header values keyed by lower-case name
     */
    public record RecordedRequest(
            String method, String uri, Map<String, List<String>> headers, String body) {

        /** Returns the first value of header {@code name}, matched ignoring case, or {@code null}. */
        public String header(String name) {
            List<String> values = headers.get(name.toLowerCase(Locale.ROOT));
            return values == null || values.isEmpty() ? null : values.get(0);
        }
    }

    private record Answer(int status, String contentType, byte[] body) {}
}

package io.opencelium.core.auth.oidc;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

/**
 * The limits of the HTTP client of the calls to an IdP that the fake IdP of the other tests replaces: a call to an
 * IdP that never answers fails after the timeout, and the client follows no redirect. The test server listens only on
 * the loopback address of the host and is a part of the test: no request leaves the host, so the test needs no
 * network. It is plain HTTP, because the check of HTTPS is a part of the discovery and not of the client.
 */
class OidcRequestFactoryTest {

	/** The loopback address of the host, the only address of the test server. */
	private static final String LOOPBACK = "127.0.0.1";

	/** A short timeout, so that the test of the timeout takes less than 1 second. */
	private static final Duration TIMEOUT = Duration.ofMillis(200);

	/** The longest time of a call in the test: much longer than the timeout, much shorter than a call without one. */
	private static final Duration BOUND = Duration.ofSeconds(5);

	/** The paths of the requests that the test server received, in their order. */
	private final List<String> requests = new CopyOnWriteArrayList<>();

	/** Lets the handler that never answers end, after the test. */
	private final CountDownLatch release = new CountDownLatch(1);

	private final ExecutorService handlers = Executors.newVirtualThreadPerTaskExecutor();

	private HttpServer server;

	@BeforeEach
	void startTheServerOnTheLoopbackAddress() throws IOException {
		server = HttpServer.create(new InetSocketAddress(InetAddress.getByName(LOOPBACK), 0), 0);
		server.setExecutor(handlers);
		server.start();
	}

	@AfterEach
	void stopTheServer() {
		release.countDown();
		server.stop(0);
		handlers.shutdownNow();
	}

	@Test
	void executeThrowsHttpTimeoutExceptionWhenTheIdpNeverAnswers() {
		server.createContext("/silent", exchange -> {
			requests.add(exchange.getRequestURI().getPath());
			awaitTheEndOfTheTest(exchange);
		});
		ClientHttpRequestFactory factory = OidcRequestFactory.create(TIMEOUT);

		assertTimeoutPreemptively(BOUND,
				() -> assertThatThrownBy(() -> factory.createRequest(addressOf("/silent"), HttpMethod.GET).execute())
					.isExactlyInstanceOf(HttpTimeoutException.class));
		assertThat(requests).as("the request reached the server").containsExactly("/silent");
	}

	@Test
	void executeGivesTheRedirectToTheCallerWhenTheIdpAnswersWithARedirect() throws IOException {
		server.createContext("/old", exchange -> {
			requests.add(exchange.getRequestURI().getPath());
			exchange.getResponseHeaders().add(HttpHeaders.LOCATION, addressOf("/new").toString());
			exchange.sendResponseHeaders(HttpStatus.FOUND.value(), -1);
			exchange.close();
		});
		server.createContext("/new", exchange -> {
			requests.add(exchange.getRequestURI().getPath());
			byte[] body = "{}".getBytes(StandardCharsets.UTF_8);
			exchange.sendResponseHeaders(HttpStatus.OK.value(), body.length);
			exchange.getResponseBody().write(body);
			exchange.close();
		});
		ClientHttpRequestFactory factory = OidcRequestFactory.create(BOUND);

		try (ClientHttpResponse response = factory.createRequest(addressOf("/old"), HttpMethod.GET).execute()) {
			assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
			assertThat(response.getHeaders().getLocation()).isEqualTo(addressOf("/new"));
		}
		assertThat(requests).containsExactly("/old");
	}

	/** The address of the path on the test server. */
	private URI addressOf(String path) {
		return URI.create("http://" + LOOPBACK + ":" + server.getAddress().getPort() + path);
	}

	/** Holds the request without an answer until the test ends. */
	private void awaitTheEndOfTheTest(HttpExchange exchange) {
		try {
			release.await();
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
		}
		finally {
			exchange.close();
		}
	}

}

package io.opencelium.core.auth.oidc;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;

/**
 * The HTTP client of the calls of core to an IdP: a timeout for the connection and for the answer, and no redirect,
 * so that a redirect answer reaches the caller as it is and core sends no request to the address of a redirect. The
 * client asks for no compressed answer, so that the size limit of a caller counts the bytes of the body itself.
 */
public final class OidcRequestFactory {

	private OidcRequestFactory() {
	}

	/**
	 * The timeout for the answer starts with the request and ends when the caller closes the response, so it also
	 * limits a body that arrives slowly. A call that reaches the timeout fails with a
	 * {@link java.net.http.HttpTimeoutException}.
	 *
	 * @param timeout the longest time to connect to the IdP, and the longest wait for its answer; it must be positive
	 * @return a new HTTP client with the timeout and without a redirect
	 * @throws IllegalArgumentException when the timeout is not positive
	 */
	public static ClientHttpRequestFactory create(Duration timeout) {
		HttpClient client = HttpClient.newBuilder()
			.followRedirects(HttpClient.Redirect.NEVER)
			.connectTimeout(timeout)
			.build();
		var factory = new JdkClientHttpRequestFactory(client);
		factory.setReadTimeout(timeout);
		factory.enableCompression(false);
		return factory;
	}

}

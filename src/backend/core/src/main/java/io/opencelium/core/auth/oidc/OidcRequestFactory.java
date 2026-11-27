package io.opencelium.core.auth.oidc;

import java.time.Duration;

import org.springframework.http.client.ClientHttpRequestFactory;

/**
 * The HTTP client of the calls of core to an IdP: a timeout for the connection and for the answer, and no redirect,
 * so that a redirect answer reaches the caller as it is and core sends no request to the address of a redirect.
 */
public final class OidcRequestFactory {

	private OidcRequestFactory() {
	}

	/**
	 * @param timeout the longest time to connect to the IdP, and the longest wait for its answer
	 * @return a new HTTP client with the timeout and without a redirect
	 */
	public static ClientHttpRequestFactory create(Duration timeout) {
		throw new UnsupportedOperationException("The HTTP client of the calls to an IdP is not implemented yet.");
	}

}

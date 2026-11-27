package io.opencelium.core.auth.oidc;

import java.time.Clock;

import org.springframework.http.client.ClientHttpRequestFactory;

/**
 * Exchanges the code of the IdP for an ID token, and checks the ID token. The token request sends the code, the
 * redirect URI and the PKCE verifier, and it authenticates core with the client ID and the client secret. The ID
 * token must have a valid signature by a public key of the IdP, the issuer of the discovery document, the client ID as
 * its audience, the nonce of the login, and an expiry after the time of the clock.
 * <p>
 * Each call to the IdP, the token request and the request of the public keys, has HTTPS only, the timeout of the HTTP
 * client, a size limit of {@value #MAX_ANSWER_BYTES} bytes and no redirect. An error names the provider ID and never
 * the body of an answer, the ID token or the code.
 */
public final class OidcIdTokenCheck {

	/** The longest body of an answer to the token request or to the request of the public keys. */
	static final int MAX_ANSWER_BYTES = 256 * 1024;

	private final ClientHttpRequestFactory requestFactory;

	private final Clock clock;

	/**
	 * @param requestFactory the HTTP client of the calls to an IdP, with the timeout and without a redirect
	 * @param clock          the clock of core, for the expiry of an ID token
	 */
	public OidcIdTokenCheck(ClientHttpRequestFactory requestFactory, Clock clock) {
		this.requestFactory = requestFactory;
		this.clock = clock;
	}

	/**
	 * @param request      the values of the login
	 * @param code         the code that the IdP gave at the redirect URI
	 * @param clientSecret the client secret of core at the IdP; the caller zeroes it after the call
	 * @return the person of the checked ID token
	 * @throws IdpErrorException        when the token request or the request of the public keys fails within the limits
	 *                                  of a call
	 * @throws InvalidIdTokenException when the ID token has a wrong issuer, audience, signature or nonce, or expired
	 */
	public OidcIdentity exchange(OidcTokenRequest request, String code, byte[] clientSecret) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

}

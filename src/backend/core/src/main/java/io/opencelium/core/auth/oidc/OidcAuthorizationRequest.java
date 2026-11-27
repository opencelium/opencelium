package io.opencelium.core.auth.oidc;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.regex.Pattern;

import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.PkceParameterNames;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;

/**
 * The request that sends a browser to the login page of an IdP for the authorization code flow: the address to open,
 * and the 3 values that core must keep until the IdP answers. The address has the client ID, the redirect URI, the
 * scope {@code openid}, the state, the nonce, and the PKCE code challenge with the method S256. It never has a client
 * secret: only the token request of core sends it.
 * <p>
 * The state, the nonce and the PKCE verifier are new random values for each request: 32 random bytes of
 * {@link SecureRandom} in the base64url form without padding, which has 43 characters and only the characters that a
 * PKCE verifier permits. They are random values and no key material, and the SHA-256 hash of the verifier uses no key.
 *
 * @param uri          the address of the login page of the IdP, with the parameters of the request, each once
 * @param state        the value that the IdP gives back at the redirect URI, which ties the answer to this request
 * @param nonce        the value that the IdP puts into the ID token, which ties the ID token to this request
 * @param codeVerifier the PKCE verifier: the code challenge in the address is its S256 hash
 */
public record OidcAuthorizationRequest(URI uri, String state, String nonce, String codeVerifier) {

	private static final int RANDOM_BYTES = 32;

	/** The characters of {@code RANDOM_BYTES} bytes in the base64url form without padding: 6 bits for each character. */
	private static final int RANDOM_VALUE_LENGTH = (RANDOM_BYTES * 8 + 5) / 6;

	private static final Pattern RANDOM_VALUE_FORM = Pattern.compile("[A-Za-z0-9_-]{" + RANDOM_VALUE_LENGTH + "}");

	private static final SecureRandom RANDOM = new SecureRandom();

	/**
	 * @param document    the discovery document of the IdP, whose authorization endpoint is the page to open
	 * @param clientId    the client ID of core at the IdP
	 * @param redirectUri the address to which the IdP sends the browser with its answer
	 * @return a new request with a new state, a new nonce and a new PKCE verifier
	 */
	public static OidcAuthorizationRequest create(OidcDiscoveryDocument document, String clientId,
			String redirectUri) {
		String state = randomValue();
		String nonce = randomValue();
		String codeVerifier = randomValue();
		OAuth2AuthorizationRequest request = OAuth2AuthorizationRequest.authorizationCode()
			.authorizationUri(document.authorizationEndpoint().toString())
			.clientId(clientId)
			.redirectUri(redirectUri)
			.scope(OidcScopes.OPENID)
			.state(state)
			.additionalParameters(parameters -> {
				parameters.put(OidcParameterNames.NONCE, nonce);
				parameters.put(PkceParameterNames.CODE_CHALLENGE, codeChallengeOf(codeVerifier));
				parameters.put(PkceParameterNames.CODE_CHALLENGE_METHOD, "S256");
			})
			.build();
		return new OidcAuthorizationRequest(URI.create(request.getAuthorizationRequestUri()), state, nonce,
				codeVerifier);
	}

	/**
	 * @param state a value that came in an answer of an IdP
	 * @return {@code true} when the value has the form of a state that this class makes; any other value names no
	 *         login, so the caller needs no read of the database to refuse it
	 */
	public static boolean hasStateForm(String state) {
		return state != null && RANDOM_VALUE_FORM.matcher(state).matches();
	}

	private static String randomValue() {
		byte[] bytes = new byte[RANDOM_BYTES];
		RANDOM.nextBytes(bytes);
		return base64Url(bytes);
	}

	/** The S256 method: the SHA-256 digest of the ASCII bytes of the verifier, in the base64url form. */
	private static String codeChallengeOf(String codeVerifier) {
		try {
			MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
			return base64Url(sha256.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII)));
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("Each JVM has SHA-256.", ex);
		}
	}

	private static String base64Url(byte[] bytes) {
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

}

package io.opencelium.core.testsupport;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.web.util.UriComponentsBuilder;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The start of an OIDC login as the browser sends it, for a test with MockMvc: the login endpoint of an OIDC provider
 * with the hash of a login verifier in the query. A login verifier is a new random value of the HTTP client. Its hash
 * is the SHA-256 digest of its ASCII bytes in the base64url form without padding, as the S256 method of PKCE, so it
 * has 43 characters.
 * <p>
 * An error of the start is a redirect of the browser to the login page of the frontend: the fixed path
 * {@value #FRONTEND_TARGET} without a host, with the error code after the {@code #}, and without a body.
 */
public final class OidcLoginRequests {

	public static final String LOGIN_PATH = "/api/auth/oidc/{providerId}/login";

	/** The query parameter of the start with the hash of the login verifier. */
	public static final String LOGIN_VERIFIER_HASH = "login-verifier-hash";

	/** The login page of the frontend for an OIDC login: a path of the origin of core, without a host. */
	public static final String FRONTEND_TARGET = "/login/oidc";

	private static final SecureRandom RANDOM = new SecureRandom();

	private OidcLoginRequests() {
	}

	/** The start of a login of the OIDC provider with the hash of a login verifier, without a session JWT. */
	public static MvcTestResult start(MockMvcTester mvc, String providerId, String loginVerifierHash) {
		return mvc.get().uri(LOGIN_PATH, providerId).param(LOGIN_VERIFIER_HASH, loginVerifierHash).exchange();
	}

	/** A new random login verifier: 32 random bytes in the base64url form without padding. */
	public static String newLoginVerifier() {
		byte[] verifier = new byte[32];
		RANDOM.nextBytes(verifier);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(verifier);
	}

	/** The hash of a new random login verifier. */
	public static String newLoginVerifierHash() {
		return s256(newLoginVerifier());
	}

	/**
	 * The S256 form of the value: its SHA-256 digest of its ASCII bytes in the base64url form without padding. It is
	 * the hash of a login verifier, and the code challenge of a PKCE verifier.
	 */
	public static String s256(String value) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.US_ASCII));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("Each JVM has SHA-256.", ex);
		}
	}

	/** The header {@code Location} of a redirect. */
	public static String locationOf(MvcTestResult response) {
		assertThat(response).as("a redirect").hasStatus(HttpStatus.FOUND);
		String location = response.getResponse().getHeader(HttpHeaders.LOCATION);
		assertThat(location).as("the target of the redirect").isNotNull();
		return location;
	}

	/** The decoded query parameters of the URL; each parameter must occur once. */
	public static Map<String, String> queryOf(String url) {
		Map<String, String> query = new LinkedHashMap<>();
		UriComponentsBuilder.fromUriString(url).build().getQueryParams().forEach((name, values) -> {
			assertThat(values).as("the values of the query parameter " + name).hasSize(1);
			query.put(name, URLDecoder.decode(values.getFirst(), StandardCharsets.UTF_8));
		});
		return query;
	}

	/**
	 * The response is a redirect to the login page of the frontend with the error code, exactly: no host, no other
	 * text, no value of the request, and no body.
	 */
	public static void assertErrorRedirect(MvcTestResult response, String errorCode) {
		assertThat(locationOf(response)).isEqualTo(FRONTEND_TARGET + "#error=" + errorCode);
		assertThat(response.getResponse().getContentAsByteArray()).as("the body of the redirect").isEmpty();
	}

}

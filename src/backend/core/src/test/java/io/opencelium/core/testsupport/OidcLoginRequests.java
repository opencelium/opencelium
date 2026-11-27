package io.opencelium.core.testsupport;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.web.util.UriComponentsBuilder;

import io.opencelium.core.testsupport.fake.FakeIdp;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The start of an OIDC login as the browser sends it, for a test with MockMvc: the login endpoint of an OIDC provider
 * with the hash of a login verifier in the query. A login verifier is a new random value of the HTTP client. Its hash
 * is the SHA-256 digest of its ASCII bytes in the base64url form without padding, as the S256 method of PKCE, so it
 * has 43 characters.
 * <p>
 * An error of the start is a redirect of the browser to the login page of the frontend: the fixed path
 * {@value #FRONTEND_TARGET} without a host, with the error code after the {@code #}, and without a body.
 * <p>
 * The IdP answers at the redirect URI of the OIDC provider. Core then redirects the browser to the same login page of
 * the frontend, with the login code of the new session or with an error code after the {@code #}.
 */
public final class OidcLoginRequests {

	public static final String LOGIN_PATH = "/api/auth/oidc/{providerId}/login";

	/** The redirect URI of an OIDC provider, at which the IdP answers. */
	public static final String CALLBACK_PATH = "/api/auth/oidc/{providerId}/callback";

	/** The query parameter of the start with the hash of the login verifier. */
	public static final String LOGIN_VERIFIER_HASH = "login-verifier-hash";

	/** The login page of the frontend for an OIDC login: a path of the origin of core, without a host. */
	public static final String FRONTEND_TARGET = "/login/oidc";

	/** A signed token in the compact form: 3 parts in the base64url form without padding. */
	private static final String SIGNED_TOKEN = "[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+";

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

	/**
	 * The login of a person at the IdP, from the start of the login at core to the redirect of the browser back to
	 * core: core redirects the browser to the login page of the IdP, and the person logs in there.
	 *
	 * @param claims the claims that the ID token gets in addition to its default claims, or in place of them
	 * @return the address of the redirect of the browser to the redirect URI, with the code and the state
	 */
	public static String logInAtTheIdp(MockMvcTester mvc, FakeIdp idp, String providerId, String loginVerifierHash,
			String subject, Map<String, ?> claims) {
		return idp.login(locationOf(start(mvc, providerId, loginVerifierHash)), subject, claims);
	}

	/** The request of the browser to the redirect URI with the answer of the IdP, as the IdP redirected it. */
	public static MvcTestResult callback(MockMvcTester mvc, String redirect) {
		return mvc.get().uri(URI.create(redirect)).exchange();
	}

	/**
	 * The response is a redirect to the login page of the frontend with a login code, exactly: no host, no other text,
	 * and no body. A login code is a signed token in the compact form, so it has 3 parts in the base64url form.
	 *
	 * @return the login code
	 */
	public static String loginCodeOf(MvcTestResult response) {
		String location = locationOf(response);
		String prefix = FRONTEND_TARGET + "#code=";
		assertThat(location).as("the target with the login code").startsWith(prefix);
		String loginCode = location.substring(prefix.length());
		assertThat(loginCode).as("the login code").matches(SIGNED_TOKEN);
		assertThat(response.getResponse().getContentAsByteArray()).as("the body of the redirect").isEmpty();
		return loginCode;
	}

	/**
	 * Saves the OIDC providers through the settings API as the default admin, each with the client ID and the client
	 * secret; they replace each other OIDC provider. No OIDC provider gives the email-link option, so it is off.
	 *
	 * @param issuerUrls the issuer URL of each provider ID
	 */
	public static void saveProviders(MockMvcTester mvc, String clientId, String clientSecret,
			Map<String, String> issuerUrls) {
		saveProviders(mvc, clientId, clientSecret, issuerUrls, Set.of());
	}

	/**
	 * Saves the OIDC providers as {@link #saveProviders(MockMvcTester, String, String, Map)} does, with the email-link
	 * option on for each provider ID of {@code emailLink}. Each other OIDC provider does not give the option, so it is
	 * off.
	 *
	 * @param issuerUrls the issuer URL of each provider ID
	 * @param emailLink  the provider IDs whose email-link option is on
	 */
	public static void saveProviders(MockMvcTester mvc, String clientId, String clientSecret,
			Map<String, String> issuerUrls, Set<String> emailLink) {
		String providers = issuerUrls.entrySet().stream()
			.map(provider -> "{\"id\": \"" + provider.getKey() + "\", \"display-name\": \"Keycloak\","
					+ " \"issuer-url\": \"" + provider.getValue() + "\", \"client-id\": \"" + clientId
					+ "\", \"client-secret\": \"" + clientSecret + "\""
					+ (emailLink.contains(provider.getKey()) ? ", \"email-link\": true" : "") + "}")
			.collect(Collectors.joining(", "));
		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				"{\"oidc.providers\": [" + providers + "]}");
		assertThat(change).as("the save of the OIDC providers").hasStatusOk();
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

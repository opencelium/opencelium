package io.opencelium.core.auth.oidc;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.security.oauth2.client.oidc.authentication.OidcIdTokenValidator;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.core.endpoint.PkceParameterNames;
import org.springframework.security.oauth2.core.oidc.StandardClaimNames;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.JacksonException;
import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Exchanges the code of the IdP for an ID token, and checks the ID token. The token request sends the code, the
 * redirect URI and the PKCE verifier, and it authenticates core with the client ID and the client secret. The ID
 * token must have a valid signature by a public key of the IdP, the issuer of the discovery document, the client ID as
 * its audience, the nonce of the login, and an expiry after the time of the clock.
 * <p>
 * Each call to the IdP, the token request and the request of the public keys, has HTTPS only, the timeout of the HTTP
 * client, a size limit of {@value #MAX_ANSWER_BYTES} bytes and no redirect. A call needs the status code 200. An error
 * names the provider ID and never the body of an answer, the ID token or the code. The decoder of the ID token reads
 * the public keys again for each check, so a rotated key of the IdP is in use at once.
 * <p>
 * The signature algorithm of an ID token is RS256, the algorithm that OpenID Connect requires of each IdP.
 */
public final class OidcIdTokenCheck {

	/** The longest body of an answer to the token request or to the request of the public keys. */
	static final int MAX_ANSWER_BYTES = 256 * 1024;

	private static final String HTTPS = "https";

	private static final JsonMapper JSON = JsonMapper.builder().enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
		.build();

	/** The HTTP client of both calls: it refuses an address without HTTPS, and an answer that has no status 200. */
	private final RestTemplate calls;

	private final Clock clock;

	/**
	 * @param requestFactory the HTTP client of the calls to an IdP, with the timeout and without a redirect
	 * @param clock          the clock of core, for the expiry of an ID token
	 */
	public OidcIdTokenCheck(ClientHttpRequestFactory requestFactory, Clock clock) {
		this.calls = new RestTemplate(requestFactory);
		this.calls.setInterceptors(List.of(OidcIdTokenCheck::limitedCall));
		this.clock = clock;
	}

	/**
	 * @param request      the values of the login
	 * @param code         the code that the IdP gave at the redirect URI
	 * @param clientSecret the client secret of core at the IdP; the caller zeroes it after the call
	 * @return the person of the checked ID token
	 * @throws IdpErrorException       when the token request or the request of the public keys fails within the limits
	 *                                 of a call
	 * @throws InvalidIdTokenException when the ID token has a wrong issuer, audience, signature or nonce, or expired
	 */
	public OidcIdentity exchange(OidcTokenRequest request, String code, byte[] clientSecret) {
		OidcDiscoveryDocument document = request.document();
		requireHttps(request.providerId(), document.tokenEndpoint(), "the token endpoint has no HTTPS");
		requireHttps(request.providerId(), document.jwksUri(), "the address of the public keys has no HTTPS");
		String idToken = requestIdToken(request, code, clientSecret);
		Jwt checked = check(request, idToken);
		String subject = checked.getSubject();
		if (subject == null || subject.isBlank()) {
			throw new InvalidIdTokenException(request.providerId(), "the ID token has no subject");
		}
		Map<String, Object> claims = checked.getClaims();
		String email = claims.get(StandardClaimNames.EMAIL) instanceof String text ? text : null;
		boolean emailVerified = Boolean.TRUE.equals(claims.get(StandardClaimNames.EMAIL_VERIFIED));
		return new OidcIdentity(document.issuer(), subject, email, emailVerified);
	}

	private static void requireHttps(String providerId, URI address, String reason) {
		if (!HTTPS.equalsIgnoreCase(address.getScheme())) {
			throw new IdpErrorException(providerId, reason);
		}
	}

	/**
	 * The token request of the authorization code flow, with the client authentication of HTTP Basic: the client ID
	 * and the client secret each in the form encoding, as RFC 6749 asks. The answer holds the ID token.
	 */
	private String requestIdToken(OidcTokenRequest request, String code, byte[] clientSecret) {
		String providerId = request.providerId();
		byte[] form = formOf(request, code);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		headers.setAccept(List.of(MediaType.APPLICATION_JSON));
		headers.setBasicAuth(basicCredentials(request.clientId(), clientSecret));
		byte[] answer;
		try {
			answer = calls.exchange(new RequestEntity<>(form, headers, HttpMethod.POST, request.document().tokenEndpoint()),
					byte[].class).getBody();
		}
		catch (RestClientException ex) {
			// No cause: the message of the exception can quote the answer of the IdP.
			throw new IdpErrorException(providerId,
					"the token request got no answer with the status code 200 within the limits of a call");
		}
		return idTokenOf(providerId, answer);
	}

	/**
	 * The body of the token request in the form encoding, as bytes. The body goes to the HTTP client as bytes and not as
	 * a form, because the HTTP client writes a form at the log level DEBUG with its values, which are the code, the
	 * redirect URI and the PKCE verifier.
	 */
	private static byte[] formOf(OidcTokenRequest request, String code) {
		String form = formField(OAuth2ParameterNames.GRANT_TYPE, AuthorizationGrantType.AUTHORIZATION_CODE.getValue())
				+ "&" + formField(OAuth2ParameterNames.CODE, code) + "&"
				+ formField(OAuth2ParameterNames.REDIRECT_URI, request.redirectUri()) + "&"
				+ formField(PkceParameterNames.CODE_VERIFIER, request.codeVerifier());
		return form.getBytes(StandardCharsets.UTF_8);
	}

	private static String formField(String name, String value) {
		return URLEncoder.encode(name, StandardCharsets.UTF_8) + "=" + URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	/**
	 * The HTTP header takes the credentials as a text, so for the time of this call the client secret is also a text
	 * that no code can zero. The caller zeroes the bytes that it gave.
	 */
	private static String basicCredentials(String clientId, byte[] clientSecret) {
		String credentials = URLEncoder.encode(clientId, StandardCharsets.UTF_8) + ":"
				+ URLEncoder.encode(new String(clientSecret, StandardCharsets.UTF_8), StandardCharsets.UTF_8);
		return Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
	}

	/** The ID token in the answer to the token request, a JSON object. The parser reports no part of the body. */
	private static String idTokenOf(String providerId, byte[] answer) {
		JsonNode tokens;
		try {
			tokens = answer == null ? null : JSON.readTree(answer);
		}
		catch (JacksonException ex) {
			throw new IdpErrorException(providerId, "the answer of the token request is not JSON");
		}
		String idToken = tokens == null ? null : tokens.path(OidcParameterNames.ID_TOKEN).stringValue(null);
		if (idToken == null || idToken.isBlank()) {
			throw new IdpErrorException(providerId, "the answer of the token request has no ID token");
		}
		return idToken;
	}

	/**
	 * Decodes the ID token with the public keys of the address in the discovery document, and checks its claims. A
	 * token that fails a check is no valid ID token. The keys that cannot be read are no fault of the token, so they
	 * are an error of the IdP.
	 */
	private Jwt check(OidcTokenRequest request, String idToken) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(request.document().jwksUri().toString())
			.restOperations(calls)
			.build();
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(claimsOf(request), nonceOf(request)));
		try {
			return decoder.decode(idToken);
		}
		catch (BadJwtException ex) {
			// No cause: the message of the exception can quote the claims of the ID token.
			throw new InvalidIdTokenException(request.providerId(),
					"its signature, issuer, audience, nonce or expiry is wrong or missing");
		}
		catch (JwtException ex) {
			throw new IdpErrorException(request.providerId(),
					"the request of the public keys got no usable answer within the limits of a call");
		}
	}

	/** The claims that OpenID Connect requires: the issuer, the subject, the audience, the expiry and the issue time. */
	private OAuth2TokenValidator<Jwt> claimsOf(OidcTokenRequest request) {
		OidcDiscoveryDocument document = request.document();
		ClientRegistration registration = ClientRegistration.withRegistrationId(request.providerId())
			.clientId(request.clientId())
			.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
			.redirectUri(request.redirectUri())
			.authorizationUri(document.authorizationEndpoint().toString())
			.tokenUri(document.tokenEndpoint().toString())
			.jwkSetUri(document.jwksUri().toString())
			.issuerUri(document.issuer())
			.build();
		var validator = new OidcIdTokenValidator(registration);
		validator.setClock(clock);
		return validator;
	}

	/** The ID token of this login has the nonce of its authorization request, and no other ID token has it. */
	private static OAuth2TokenValidator<Jwt> nonceOf(OidcTokenRequest request) {
		return new JwtClaimValidator<Object>(OidcParameterNames.NONCE, request.nonce()::equals);
	}

	/**
	 * The step of each call of this class. It refuses an address without HTTPS before the request. It accepts an answer
	 * with the status code 200 only, so that a redirect or an error has no use, and it reads at most
	 * {@value #MAX_ANSWER_BYTES} bytes of the body: 1 more byte shows that the body is longer than the limit. The
	 * response of the HTTP client is closed here, which also ends the timeout of the call.
	 */
	private static ClientHttpResponse limitedCall(HttpRequest request, byte[] body,
			ClientHttpRequestExecution execution) throws IOException {
		if (!HTTPS.equalsIgnoreCase(request.getURI().getScheme())) {
			throw new IOException("The address has no HTTPS.");
		}
		try (ClientHttpResponse response = execution.execute(request, body)) {
			if (response.getStatusCode().value() != HttpStatus.OK.value()) {
				throw new IOException("The IdP did not answer with the status code 200.");
			}
			byte[] answer = response.getBody().readNBytes(MAX_ANSWER_BYTES + 1);
			if (answer.length > MAX_ANSWER_BYTES) {
				throw new IOException("The body of the answer is longer than the limit.");
			}
			return new LimitedAnswer(response.getHeaders(), answer);
		}
	}

	/** An answer that was read within the limits: the status code 200, its headers and its body in memory. */
	private record LimitedAnswer(HttpHeaders headers, byte[] body) implements ClientHttpResponse {

		@Override
		public HttpStatusCode getStatusCode() {
			return HttpStatus.OK;
		}

		@Override
		public String getStatusText() {
			return HttpStatus.OK.getReasonPhrase();
		}

		@Override
		public HttpHeaders getHeaders() {
			return headers;
		}

		@Override
		public InputStream getBody() {
			return new ByteArrayInputStream(body);
		}

		@Override
		public void close() {
		}

	}

}

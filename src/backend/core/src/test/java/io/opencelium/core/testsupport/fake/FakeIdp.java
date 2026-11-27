package io.opencelium.core.testsupport.fake;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.mock.http.client.MockClientHttpResponse;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.json.JsonMapper;

/**
 * An IdP for the tests, without a network: a request factory of the HTTP client of Spring that answers each request
 * from memory. A test lets it serve the discovery document of an issuer URL, or a fixed answer at an address; each
 * other address gets the status code 404 with an empty body. It records the address of each request, so that a test
 * sees that core made no request. A served answer has no {@code Content-Length} header, as a chunked answer.
 * <p>
 * For an issuer URL whose discovery document it serves with {@link #serveDiscoveryDocument(String)}, the fake is also
 * the IdP of the authorization code flow:
 * <ul>
 * <li>{@link #login} is the login of a person at the login page of the IdP: the fake reads the authorization request
 * that core sent the browser to, keeps a new code for it, and gives the address of the redirect of the browser back to
 * core, with the code and the state.</li>
 * <li>The token endpoint ({@value #TOKEN_PATH} below the issuer URL) accepts a code once, for the client ID and the
 * redirect URI of its authorization request, with the PKCE verifier of its S256 code challenge, and with the client
 * secret of {@link #registerClient} in the header {@code Authorization} (HTTP Basic) or in the body. It answers with an
 * access token and an ID token; else with the status code 400 or 401 and an error of RFC 6749.</li>
 * <li>The ID token has RS256 and the key ID {@value #KEY_ID}, and the claims {@code iss} (the issuer URL), {@code sub},
 * {@code aud} (the client ID), {@code nonce} (of the authorization request), {@code iat} (the time of its clock) and
 * {@code exp} ({@link #ID_TOKEN_LIFE} later). A login can add claims or change them, and a {@code null} value removes a
 * claim. {@link #signIdTokens} gives the ID tokens a wrong signature or none.</li>
 * <li>The key address ({@value #KEYS_PATH} below the issuer URL) serves the public key of the ID tokens as a JWK
 * set.</li>
 * </ul>
 * The fake makes its RSA keys in memory at the first use, and keeps them until the end of the JVM: core can keep the
 * public keys of an IdP for a time. No test resource holds a key. A fixed answer of {@link #answer} at an address
 * comes before the answer of the token endpoint or the key address there.
 * <p>
 * A unit test gives it to the OIDC client of core as its request factory. A full-application test puts it in place of
 * the bean {@value #BEAN_NAME}, the HTTP client of the calls of core to an IdP. Each test class has its own application
 * context, so each test class has its own fake in a static field:
 * <pre>{@code
 * static final FakeIdp IDP = new FakeIdp();
 *
 * @TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
 * ClientHttpRequestFactory oidcRequestFactory;
 *
 * static ClientHttpRequestFactory fakeIdp() {
 *     return IDP;
 * }
 * }</pre>
 */
public final class FakeIdp implements ClientHttpRequestFactory {

	/** The name of the bean of the HTTP client of the calls of core to an IdP. */
	public static final String BEAN_NAME = "oidcRequestFactory";

	/** The path that OIDC Discovery 1.0 appends to an issuer URL for its discovery document. */
	public static final String DISCOVERY_PATH = "/.well-known/openid-configuration";

	/** The path of the login page below the issuer URL, in a served discovery document. */
	public static final String AUTHORIZATION_PATH = "/authorize";

	/** The path of the token request below the issuer URL, in a served discovery document. */
	public static final String TOKEN_PATH = "/token";

	/** The path of the public keys below the issuer URL, in a served discovery document. */
	public static final String KEYS_PATH = "/keys";

	/** The key ID of the public key that the key address serves. */
	public static final String KEY_ID = "fake-idp-key";

	/** The time from the issue of an ID token to its expiry. */
	public static final Duration ID_TOKEN_LIFE = Duration.ofMinutes(5);

	/** The signature of the ID tokens that the token endpoint issues. */
	public enum IdTokenSignature {

		/** A signature by the key that the key address serves. */
		SERVED_KEY,

		/** A signature by another key, with the key ID of the served key: the signature does not match the key. */
		ANOTHER_KEY_WITH_THE_SERVED_KEY_ID,

		/** A signature by another key, with a key ID that the key address does not serve. */
		UNKNOWN_KEY_ID,

		/** No signature: the algorithm {@code none}. */
		NONE

	}

	private static final String UNKNOWN_KEY_ID = "fake-idp-unknown-key";

	private static final String PADDING_FIELD = "padding";

	private static final JsonMapper JSON = JsonMapper.builder().build();

	private static final SecureRandom RANDOM = new SecureRandom();

	private final Clock clock;

	private final Map<URI, Answer> answers = new ConcurrentHashMap<>();

	private final List<URI> requests = new CopyOnWriteArrayList<>();

	/** The issuer URL of each authorization endpoint, token endpoint and key address that the fake serves. */
	private final Map<URI, String> authorizationEndpoints = new ConcurrentHashMap<>();

	private final Map<URI, String> tokenEndpoints = new ConcurrentHashMap<>();

	private final Map<URI, String> keyAddresses = new ConcurrentHashMap<>();

	/** The client secret of each registered client ID. */
	private final Map<String, String> clients = new ConcurrentHashMap<>();

	/** The authorization request of each code that the token endpoint has not accepted yet. */
	private final Map<String, Authorization> codes = new ConcurrentHashMap<>();

	private final List<String> issuedTokens = new CopyOnWriteArrayList<>();

	private volatile IdTokenSignature signature = IdTokenSignature.SERVED_KEY;

	private volatile int tokenAnswerLength;

	private volatile int keyAnswerLength;

	private volatile Keys keys;

	/** A fake whose ID tokens have the time of the clock of the system. */
	public FakeIdp() {
		this(Clock.systemUTC());
	}

	/** A fake whose ID tokens have the time of the clock, for example the mutable clock of core in a test. */
	public FakeIdp(Clock clock) {
		this.clock = clock;
	}

	/**
	 * Serves the discovery document of the issuer URL: its issuer is the issuer URL, as {@link #documentOf}. The fake
	 * is then also the login page, the token endpoint and the key address of that document.
	 */
	public void serveDiscoveryDocument(String issuerUrl) {
		serveDiscoveryDocument(issuerUrl, documentOf(issuerUrl));
		String base = withoutTerminatingSlash(issuerUrl);
		authorizationEndpoints.put(URI.create(base + AUTHORIZATION_PATH), issuerUrl);
		tokenEndpoints.put(URI.create(base + TOKEN_PATH), issuerUrl);
		keyAddresses.put(URI.create(base + KEYS_PATH), issuerUrl);
	}

	/** Serves the JSON text as the discovery document of the issuer URL, with the status code 200. */
	public void serveDiscoveryDocument(String issuerUrl, String document) {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		answer(discoveryUrlOf(issuerUrl), HttpStatus.OK, headers, document);
	}

	/**
	 * The discovery document of the issuer URL gets the status code 404 from now on. The login page, the token
	 * endpoint and the key address of the issuer URL stay.
	 */
	public void stopServingDiscoveryDocument(String issuerUrl) {
		answers.remove(URI.create(discoveryUrlOf(issuerUrl)));
	}

	/** Answers each request to the address with the status code, the headers and the body. */
	public void answer(String url, HttpStatusCode status, HttpHeaders headers, String body) {
		HttpHeaders copy = new HttpHeaders();
		copy.putAll(headers);
		answers.put(URI.create(url), new Answer(status, copy, body.getBytes(StandardCharsets.UTF_8)));
	}

	/** A request to the address fails with an I/O error and gets no answer, as a host that does not answer. */
	public void unreachable(String url) {
		answers.put(URI.create(url), new Answer(null, new HttpHeaders(), new byte[0]));
	}

	/** The token endpoint accepts the client ID with this client secret. */
	public void registerClient(String clientId, String clientSecret) {
		clients.put(clientId, clientSecret);
	}

	/**
	 * The login of a person at the login page of the IdP, with an ID token that has the default claims.
	 *
	 * @see #login(String, String, Map)
	 */
	public String login(String authorizationUrl, String subject) {
		return login(authorizationUrl, subject, Map.of());
	}

	/**
	 * The login of a person at the login page of the IdP. The fake keeps a new code for the authorization request, and
	 * the ID token of that code has the subject and the claims.
	 *
	 * @param authorizationUrl the address of the login page with the authorization request, as core redirected the
	 *                         browser to it
	 * @param subject          the claim {@code sub} of the ID token
	 * @param claims           claims that the ID token gets in addition to its default claims or in place of them; a
	 *                         {@code null} value removes the claim. A time is an {@link Instant}.
	 * @return the address of the redirect of the browser: the redirect URI with the code and the state
	 * @throws IllegalArgumentException when the address is no authorization request of the authorization code flow
	 *                                  with PKCE at a login page of the fake
	 */
	public String login(String authorizationUrl, String subject, Map<String, ?> claims) {
		Map<String, String> request = authorizationRequestOf(authorizationUrl);
		String code = randomValue();
		codes.put(code, new Authorization(issuerOfLoginPage(authorizationUrl), request.get("client_id"),
				request.get("redirect_uri"), request.get("nonce"), request.get("code_challenge"), subject,
				new HashMap<>(claims)));
		return UriComponentsBuilder.fromUriString(request.get("redirect_uri"))
			.queryParam("code", encode(code))
			.queryParam("state", encode(request.get("state")))
			.build(true)
			.toUriString();
	}

	/**
	 * The login page refuses the login with the error code of RFC 6749, for example {@code access_denied}.
	 *
	 * @return the address of the redirect of the browser: the redirect URI with the error code and the state
	 */
	public String refuseLogin(String authorizationUrl, String error) {
		Map<String, String> request = authorizationRequestOf(authorizationUrl);
		issuerOfLoginPage(authorizationUrl);
		return UriComponentsBuilder.fromUriString(request.get("redirect_uri"))
			.queryParam("error", encode(error))
			.queryParam("state", encode(request.get("state")))
			.build(true)
			.toUriString();
	}

	/** The signature of the ID tokens that the token endpoint issues from now on. */
	public void signIdTokens(IdTokenSignature signature) {
		this.signature = signature;
	}

	/** Each answer of the token endpoint with tokens has exactly this number of bytes, with a padding field. */
	public void padTokenAnswersTo(int bytes) {
		this.tokenAnswerLength = bytes;
	}

	/** Each answer of the key address has exactly this number of bytes, with a padding field. */
	public void padKeyAnswersTo(int bytes) {
		this.keyAnswerLength = bytes;
	}

	/** Each ID token and each access token that the token endpoint gave, in their order. */
	public List<String> issuedTokens() {
		return List.copyOf(issuedTokens);
	}

	/** The address of each request, in the order of the requests. */
	public List<URI> requests() {
		return List.copyOf(requests);
	}

	/**
	 * Removes each answer, each recorded request, each served issuer URL, each registered client, each code and each
	 * issued token, and signs the ID tokens with the served key again without a padding. The keys stay.
	 */
	public void reset() {
		answers.clear();
		requests.clear();
		authorizationEndpoints.clear();
		tokenEndpoints.clear();
		keyAddresses.clear();
		clients.clear();
		codes.clear();
		issuedTokens.clear();
		signature = IdTokenSignature.SERVED_KEY;
		tokenAnswerLength = 0;
		keyAnswerLength = 0;
	}

	/**
	 * The address of the discovery document of the issuer URL: the issuer URL without a terminating {@code /}, then
	 * {@value #DISCOVERY_PATH} (OIDC Discovery 1.0, section 4.1).
	 */
	public static String discoveryUrlOf(String issuerUrl) {
		return withoutTerminatingSlash(issuerUrl) + DISCOVERY_PATH;
	}

	/** The address of the token endpoint of the issuer URL, in a served discovery document. */
	public static String tokenUrlOf(String issuerUrl) {
		return withoutTerminatingSlash(issuerUrl) + TOKEN_PATH;
	}

	/** The address of the public keys of the issuer URL, in a served discovery document. */
	public static String keysUrlOf(String issuerUrl) {
		return withoutTerminatingSlash(issuerUrl) + KEYS_PATH;
	}

	/**
	 * A discovery document with each field that OIDC Discovery 1.0 requires for the authorization code flow: the
	 * issuer, and the login page, the token request and the public keys below the issuer.
	 */
	public static String documentOf(String issuer) {
		return documentOf(issuer, Map.of());
	}

	/** A discovery document as {@link #documentOf(String)}, with more fields or other values of its fields. */
	public static String documentOf(String issuer, Map<String, ?> moreFields) {
		Map<String, Object> document = fieldsOf(issuer);
		document.putAll(moreFields);
		return JSON.writeValueAsString(document);
	}

	/** A discovery document as {@link #documentOf(String)}, without the field. */
	public static String documentWithout(String issuer, String field) {
		Map<String, Object> document = fieldsOf(issuer);
		document.remove(field);
		return JSON.writeValueAsString(document);
	}

	private static Map<String, Object> fieldsOf(String issuer) {
		String base = withoutTerminatingSlash(issuer);
		Map<String, Object> document = new LinkedHashMap<>();
		document.put("issuer", issuer);
		document.put("authorization_endpoint", base + AUTHORIZATION_PATH);
		document.put("token_endpoint", base + TOKEN_PATH);
		document.put("jwks_uri", base + KEYS_PATH);
		document.put("response_types_supported", List.of("code"));
		document.put("subject_types_supported", List.of("public"));
		document.put("id_token_signing_alg_values_supported", List.of("RS256"));
		return document;
	}

	@Override
	public ClientHttpRequest createRequest(URI uri, HttpMethod httpMethod) {
		return new MockClientHttpRequest(httpMethod, uri) {

			@Override
			protected ClientHttpResponse executeInternal() throws IOException {
				requests.add(uri);
				Answer answer = answers.get(uri);
				if (answer != null) {
					return answer.response(uri);
				}
				String tokenIssuer = tokenEndpoints.get(uri);
				if (tokenIssuer != null) {
					return tokenAnswer(tokenIssuer, getMethod(), getHeaders(),
							getBodyAsString(StandardCharsets.UTF_8));
				}
				if (keyAddresses.containsKey(uri)) {
					return keyAnswer(getMethod());
				}
				return new MockClientHttpResponse(new byte[0], HttpStatus.NOT_FOUND);
			}

		};
	}

	/**
	 * The answer of the token endpoint: the tokens for a valid code of a registered client, else an error of RFC 6749,
	 * section 5.2. A code has 1 use, also when the request fails.
	 */
	private ClientHttpResponse tokenAnswer(String issuer, HttpMethod method, HttpHeaders headers, String body) {
		if (!HttpMethod.POST.equals(method)) {
			return json(HttpStatus.METHOD_NOT_ALLOWED, Map.of("error", "invalid_request"), 0);
		}
		Map<String, String> form = formOf(body);
		String clientId = authenticatedClient(headers, form);
		if (clientId == null) {
			return json(HttpStatus.UNAUTHORIZED, Map.of("error", "invalid_client"), 0);
		}
		String code = form.get("code");
		Authorization authorization = code != null ? codes.remove(code) : null;
		String codeVerifier = form.get("code_verifier");
		if (authorization == null || !"authorization_code".equals(form.get("grant_type"))
				|| !issuer.equals(authorization.issuer()) || !clientId.equals(authorization.clientId())
				|| !Objects.equals(form.get("redirect_uri"), authorization.redirectUri()) || codeVerifier == null
				|| !s256(codeVerifier).equals(authorization.codeChallenge())) {
			return json(HttpStatus.BAD_REQUEST, Map.of("error", "invalid_grant"), 0);
		}
		String idToken = idTokenOf(authorization);
		String accessToken = randomValue();
		issuedTokens.add(idToken);
		issuedTokens.add(accessToken);
		Map<String, Object> tokens = new LinkedHashMap<>();
		tokens.put("access_token", accessToken);
		tokens.put("token_type", "Bearer");
		tokens.put("expires_in", ID_TOKEN_LIFE.toSeconds());
		tokens.put("scope", "openid");
		tokens.put("id_token", idToken);
		return json(HttpStatus.OK, tokens, tokenAnswerLength);
	}

	private ClientHttpResponse keyAnswer(HttpMethod method) {
		if (!HttpMethod.GET.equals(method)) {
			return new MockClientHttpResponse(new byte[0], HttpStatus.METHOD_NOT_ALLOWED);
		}
		Map<String, Object> keySet = new JWKSet(keys().served().toPublicJWK()).toJSONObject(true);
		return json(HttpStatus.OK, keySet, keyAnswerLength);
	}

	/**
	 * The client ID of a request with the client secret of a registered client: in the header {@code Authorization}
	 * with HTTP Basic, whose 2 parts have the form encoding (RFC 6749, section 2.3.1), or in the body.
	 */
	private String authenticatedClient(HttpHeaders headers, Map<String, String> form) {
		String clientId = form.get("client_id");
		String clientSecret = form.get("client_secret");
		String authorization = headers.getFirst(HttpHeaders.AUTHORIZATION);
		if (authorization != null && authorization.regionMatches(true, 0, "Basic ", 0, 6)) {
			String credentials;
			try {
				credentials = new String(Base64.getDecoder().decode(authorization.substring(6).trim()),
						StandardCharsets.UTF_8);
			}
			catch (IllegalArgumentException ex) {
				return null;
			}
			int colon = credentials.indexOf(':');
			if (colon < 0) {
				return null;
			}
			clientId = decode(credentials.substring(0, colon));
			clientSecret = decode(credentials.substring(colon + 1));
		}
		return clientId != null && clientSecret != null && clientSecret.equals(clients.get(clientId)) ? clientId
				: null;
	}

	private String idTokenOf(Authorization authorization) {
		Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
		Map<String, Object> claims = new LinkedHashMap<>();
		claims.put("iss", authorization.issuer());
		claims.put("sub", authorization.subject());
		claims.put("aud", authorization.clientId());
		claims.put("nonce", authorization.nonce());
		claims.put("iat", now);
		claims.put("exp", now.plus(ID_TOKEN_LIFE));
		authorization.claims().forEach((name, value) -> {
			if (value == null) {
				claims.remove(name);
			}
			else {
				claims.put(name, value);
			}
		});
		var builder = new JWTClaimsSet.Builder();
		claims.forEach((name, value) -> builder.claim(name, value instanceof Instant time ? Date.from(time) : value));
		JWTClaimsSet claimsSet = builder.build();
		return switch (signature) {
			case SERVED_KEY -> signed(claimsSet, keys().served());
			case ANOTHER_KEY_WITH_THE_SERVED_KEY_ID -> signed(claimsSet, keys().impostor());
			case UNKNOWN_KEY_ID -> signed(claimsSet, keys().unknown());
			case NONE -> new PlainJWT(claimsSet).serialize();
		};
	}

	private static String signed(JWTClaimsSet claims, RSAKey key) {
		var header = new JWSHeader.Builder(JWSAlgorithm.RS256).type(JOSEObjectType.JWT).keyID(key.getKeyID()).build();
		var token = new SignedJWT(header, claims);
		try {
			token.sign(new RSASSASigner(key));
		}
		catch (JOSEException ex) {
			throw new IllegalStateException("The fake IdP cannot sign an ID token.", ex);
		}
		return token.serialize();
	}

	/** The keys of the fake: made at the first use, so that a test without an ID token makes no key. */
	private Keys keys() {
		Keys made = keys;
		if (made == null) {
			synchronized (this) {
				made = keys;
				if (made == null) {
					made = new Keys(rsaKey(KEY_ID), rsaKey(KEY_ID), rsaKey(UNKNOWN_KEY_ID));
					keys = made;
				}
			}
		}
		return made;
	}

	private static RSAKey rsaKey(String keyId) {
		try {
			return new RSAKeyGenerator(2048).keyID(keyId).keyUse(KeyUse.SIGNATURE).algorithm(JWSAlgorithm.RS256)
				.generate();
		}
		catch (JOSEException ex) {
			throw new IllegalStateException("The fake IdP cannot make a key.", ex);
		}
	}

	/**
	 * A JSON answer without a {@code Content-Length} header. A length above 0 adds a padding field, so that the body
	 * has exactly that number of bytes.
	 */
	private static ClientHttpResponse json(HttpStatus status, Map<String, ?> fields, int length) {
		String body = JSON.writeValueAsString(fields);
		if (length > 0) {
			String start = body.substring(0, body.length() - 1) + ",\"" + PADDING_FIELD + "\":\"";
			String end = "\"}";
			int padding = length - start.length() - end.length();
			if (padding < 0) {
				throw new IllegalArgumentException("The answer has more than " + length + " bytes without a padding.");
			}
			body = start + "a".repeat(padding) + end;
		}
		var response = new MockClientHttpResponse(body.getBytes(StandardCharsets.UTF_8), status);
		response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
		return response;
	}

	/** The query of an authorization request of the authorization code flow with PKCE S256. */
	private static Map<String, String> authorizationRequestOf(String authorizationUrl) {
		Map<String, String> request = new LinkedHashMap<>();
		UriComponentsBuilder.fromUriString(authorizationUrl).build().getQueryParams()
			.forEach((name, values) -> request.put(name, decode(values.getFirst())));
		if (!"code".equals(request.get("response_type")) || request.get("client_id") == null
				|| request.get("redirect_uri") == null || request.get("state") == null
				|| request.get("code_challenge") == null || !"S256".equals(request.get("code_challenge_method"))) {
			throw new IllegalArgumentException("The address is no authorization request of the code flow with PKCE.");
		}
		return request;
	}

	private String issuerOfLoginPage(String authorizationUrl) {
		URI address = URI.create(authorizationUrl);
		URI page = URI.create(address.getScheme() + "://" + address.getRawAuthority() + address.getRawPath());
		String issuer = authorizationEndpoints.get(page);
		if (issuer == null) {
			throw new IllegalArgumentException("The fake IdP has no login page at " + page + ".");
		}
		return issuer;
	}

	/** The fields of a body in the form encoding; each field once. */
	private static Map<String, String> formOf(String body) {
		Map<String, String> form = new LinkedHashMap<>();
		if (body == null || body.isEmpty()) {
			return form;
		}
		for (String pair : body.split("&")) {
			int equals = pair.indexOf('=');
			String name = decode(equals < 0 ? pair : pair.substring(0, equals));
			String value = equals < 0 ? "" : decode(pair.substring(equals + 1));
			form.put(name, value);
		}
		return form;
	}

	private static String s256(String value) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.US_ASCII));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("Each JVM has SHA-256.", ex);
		}
	}

	private static String randomValue() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	private static String decode(String value) {
		return URLDecoder.decode(value, StandardCharsets.UTF_8);
	}

	private static String withoutTerminatingSlash(String url) {
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}

	/**
	 * @param status the status code, or {@code null} for a host that does not answer
	 */
	private record Answer(HttpStatusCode status, HttpHeaders headers, byte[] body) {

		ClientHttpResponse response(URI uri) throws IOException {
			if (status == null) {
				throw new ConnectException("The test IdP does not answer at " + uri + ".");
			}
			var response = new MockClientHttpResponse(body.clone(), status);
			response.getHeaders().putAll(headers);
			return response;
		}

	}

	/** The authorization request of a code, and the person and the claims of its ID token. */
	private record Authorization(String issuer, String clientId, String redirectUri, String nonce,
			String codeChallenge, String subject, Map<String, ?> claims) {

	}

	/**
	 * @param served   the key of the key address
	 * @param impostor another key with the key ID of the served key
	 * @param unknown  another key with a key ID that the key address does not serve
	 */
	private record Keys(RSAKey served, RSAKey impostor, RSAKey unknown) {

	}

}

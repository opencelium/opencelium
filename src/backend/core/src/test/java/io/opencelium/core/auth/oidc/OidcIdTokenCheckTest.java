package io.opencelium.core.auth.oidc;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import io.opencelium.core.testsupport.fake.FakeIdp;
import io.opencelium.core.testsupport.fake.FakeIdp.IdTokenSignature;

import static io.opencelium.core.testsupport.OidcLoginRequests.queryOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.catchThrowable;

/**
 * The OIDC client exchanges the code of the IdP for an ID token, and accepts the ID token only with a valid signature
 * by a public key of the IdP, the issuer of the discovery document, the client ID as its audience, the nonce of the
 * login and an expiry after the time of the clock of core. A refused ID token is an {@link InvalidIdTokenException}.
 * <p>
 * Each call to the IdP, the token request and the request of its public keys, has HTTPS only, a size limit and no
 * redirect. A call that fails is an {@link IdpErrorException}, whose message names the provider ID and holds no part
 * of the answer of the IdP. The fake IdP answers from memory, so the timeout of a call is a part of the HTTP client,
 * which its own test examines.
 * <p>
 * The fake IdP and the OIDC client have 1 fixed clock. An expired ID token expired 10 minutes before that time: the
 * tests do not fix a tolerance for the difference between the clocks of core and of the IdP.
 */
class OidcIdTokenCheckTest {

	private static final String PROVIDER_ID = "staff-idp";

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final String CLIENT_ID = "core";

	private static final String REDIRECT_URI = "https://oc.example.com/api/auth/oidc/staff-idp/callback";

	private static final String SUBJECT = "f3a1c2d4-5b6e-4f70-8a91-b2c3d4e5f607";

	/** A text that an answer of the IdP holds, and that no message of an error may hold. */
	private static final String ANSWER_TEXT = "answer-text-of-the-idp-7c1e";

	private static final Instant NOW = Instant.now().truncatedTo(ChronoUnit.SECONDS);

	private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);

	/** 1 fake for the class, so that it makes its RSA keys once. */
	private static final FakeIdp IDP = new FakeIdp(CLOCK);

	private static final OidcDiscoveryDocument DOCUMENT = documentWith(FakeIdp.tokenUrlOf(ISSUER_URL),
			FakeIdp.keysUrlOf(ISSUER_URL));

	private final String clientSecret = UUID.randomUUID().toString();

	private final OidcIdTokenCheck check = new OidcIdTokenCheck(IDP, CLOCK);

	@BeforeEach
	void serveTheIdp() {
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
		IDP.registerClient(CLIENT_ID, clientSecret);
	}

	@Test
	void exchangeGivesTheIssuerTheSubjectAndTheEmailOfTheIdTokenWhenTheIdTokenIsCorrect() {
		Login login = logIn(Map.of("email", "alice@example.com", "email_verified", true));

		OidcIdentity identity = exchange(login);

		assertThat(identity).isEqualTo(new OidcIdentity(ISSUER_URL, SUBJECT, "alice@example.com", true));
	}

	@Test
	void exchangeGivesNoEmailAndNoVerifiedEmailWhenTheCorrectIdTokenHasNoEmail() {
		Login login = logIn(Map.of());

		OidcIdentity identity = exchange(login);

		assertThat(identity).isEqualTo(new OidcIdentity(ISSUER_URL, SUBJECT, null, false));
	}

	@Test
	void exchangeThrowsInvalidIdTokenWhenTheIssuerIsAnotherUrl() {
		Login login = logIn(Map.of("iss", "https://other-idp.example.com/realms/oc"));

		assertThatExceptionOfType(InvalidIdTokenException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeThrowsInvalidIdTokenWhenTheAudienceIsAnotherClient() {
		Login login = logIn(Map.of("aud", "other-client"));

		assertThatExceptionOfType(InvalidIdTokenException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeThrowsInvalidIdTokenWhenTheSignatureIsOfAnotherKeyWithTheKeyIdOfThePublicKey() {
		IDP.signIdTokens(IdTokenSignature.ANOTHER_KEY_WITH_THE_SERVED_KEY_ID);
		Login login = logIn(Map.of());

		assertThatExceptionOfType(InvalidIdTokenException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeThrowsInvalidIdTokenWhenTheKeyIdNamesNoPublicKeyOfTheIdp() {
		IDP.signIdTokens(IdTokenSignature.UNKNOWN_KEY_ID);
		Login login = logIn(Map.of());

		assertThatExceptionOfType(InvalidIdTokenException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeThrowsInvalidIdTokenWhenTheIdTokenHasNoSignature() {
		IDP.signIdTokens(IdTokenSignature.NONE);
		Login login = logIn(Map.of());

		assertThatExceptionOfType(InvalidIdTokenException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeThrowsInvalidIdTokenWhenTheNonceIsAnotherValue() {
		Login login = logIn(Map.of("nonce", "nonce-of-another-login"));

		assertThatExceptionOfType(InvalidIdTokenException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeThrowsInvalidIdTokenWhenTheIdTokenHasNoNonce() {
		Login login = logIn(Collections.singletonMap("nonce", null));

		assertThatExceptionOfType(InvalidIdTokenException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeThrowsInvalidIdTokenWhenTheIdTokenIsExpired() {
		Login login = logIn(Map.of("iat", NOW.minus(Duration.ofMinutes(15)), "exp", NOW.minus(Duration.ofMinutes(10))));

		assertThatExceptionOfType(InvalidIdTokenException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeNamesTheProviderIdAndNeitherTheIdTokenNorTheCodeWhenItRefusesTheIdToken() {
		Login login = logIn(Map.of("iss", "https://other-idp.example.com/realms/oc"));

		Throwable refusal = catchThrowable(() -> exchange(login));

		assertThat(refusal).isExactlyInstanceOf(InvalidIdTokenException.class).hasMessageContaining(PROVIDER_ID);
		List<String> idTokens = IDP.issuedTokens();
		assertThat(idTokens).as("the tokens of the IdP").isNotEmpty();
		for (String message : messagesOf(refusal)) {
			assertThat(message).doesNotContain(login.code());
			idTokens.forEach(token -> assertThat(message).doesNotContain(token));
		}
	}

	@Test
	void exchangeThrowsIdpErrorWithoutARequestWhenTheTokenEndpointHasNoHttps() {
		String tokenEndpoint = "http://idp.example.com/realms/oc" + FakeIdp.TOKEN_PATH;
		Login login = logIn(Map.of());

		assertThatExceptionOfType(IdpErrorException.class).isThrownBy(
				() -> exchange(documentWith(tokenEndpoint, FakeIdp.keysUrlOf(ISSUER_URL)), login));
		assertThat(IDP.requests()).doesNotContain(URI.create(tokenEndpoint));
	}

	@Test
	void exchangeThrowsIdpErrorWithoutARequestToTheTargetWhenTheTokenEndpointAnswersWithARedirect() {
		String target = "https://elsewhere.example.com/token";
		IDP.answer(FakeIdp.tokenUrlOf(ISSUER_URL), HttpStatus.FOUND, redirectTo(target), "");
		Login login = logIn(Map.of());

		assertThatExceptionOfType(IdpErrorException.class).isThrownBy(() -> exchange(login));
		assertThat(IDP.requests()).doesNotContain(URI.create(target));
	}

	@Test
	void exchangeThrowsIdpErrorWhenTheAnswerOfTheTokenRequestIsLongerThanTheLimit() {
		IDP.padTokenAnswersTo(OidcIdTokenCheck.MAX_ANSWER_BYTES + 1);
		Login login = logIn(Map.of());

		assertThatExceptionOfType(IdpErrorException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeAcceptsTheIdTokenWhenTheAnswerOfTheTokenRequestHasTheLengthOfTheLimit() {
		IDP.padTokenAnswersTo(OidcIdTokenCheck.MAX_ANSWER_BYTES);
		Login login = logIn(Map.of());

		OidcIdentity identity = exchange(login);

		assertThat(identity.subject()).isEqualTo(SUBJECT);
	}

	@Test
	void exchangeThrowsIdpErrorWhenTheIdpDoesNotAnswerTheTokenRequest() {
		IDP.unreachable(FakeIdp.tokenUrlOf(ISSUER_URL));
		Login login = logIn(Map.of());

		assertThatExceptionOfType(IdpErrorException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeThrowsIdpErrorWhenTheIdpRefusesTheCode() {
		Login login = logIn(Map.of());
		Login forged = new Login(login.authorization(), "code-that-the-idp-never-gave");

		assertThatExceptionOfType(IdpErrorException.class).isThrownBy(() -> exchange(forged));
	}

	@Test
	void exchangeNamesTheProviderIdAndNoPartOfTheAnswerWhenTheIdpRefusesTheTokenRequest() {
		IDP.answer(FakeIdp.tokenUrlOf(ISSUER_URL), HttpStatus.BAD_REQUEST, jsonHeaders(),
				"{\"error\": \"invalid_grant\", \"error_description\": \"" + ANSWER_TEXT + "\"}");
		Login login = logIn(Map.of());

		Throwable failure = catchThrowable(() -> exchange(login));

		assertThat(failure).isExactlyInstanceOf(IdpErrorException.class).hasMessageContaining(PROVIDER_ID);
		messagesOf(failure).forEach(message -> assertThat(message).doesNotContain(ANSWER_TEXT, login.code()));
	}

	@Test
	void exchangeThrowsIdpErrorWithoutARequestWhenTheKeyAddressHasNoHttps() {
		String keyAddress = "http://idp.example.com/realms/oc" + FakeIdp.KEYS_PATH;
		Login login = logIn(Map.of());

		assertThatExceptionOfType(IdpErrorException.class).isThrownBy(
				() -> exchange(documentWith(FakeIdp.tokenUrlOf(ISSUER_URL), keyAddress), login));
		assertThat(IDP.requests()).doesNotContain(URI.create(keyAddress));
	}

	@Test
	void exchangeThrowsIdpErrorWithoutARequestToTheTargetWhenTheKeyAddressAnswersWithARedirect() {
		String target = "https://elsewhere.example.com/keys";
		IDP.answer(FakeIdp.keysUrlOf(ISSUER_URL), HttpStatus.FOUND, redirectTo(target), "");
		Login login = logIn(Map.of());

		assertThatExceptionOfType(IdpErrorException.class).isThrownBy(() -> exchange(login));
		assertThat(IDP.requests()).doesNotContain(URI.create(target));
	}

	@Test
	void exchangeThrowsIdpErrorWhenTheAnswerOfTheKeyRequestIsLongerThanTheLimit() {
		IDP.padKeyAnswersTo(OidcIdTokenCheck.MAX_ANSWER_BYTES + 1);
		Login login = logIn(Map.of());

		assertThatExceptionOfType(IdpErrorException.class).isThrownBy(() -> exchange(login));
	}

	@Test
	void exchangeAcceptsTheIdTokenWhenTheAnswerOfTheKeyRequestHasTheLengthOfTheLimit() {
		IDP.padKeyAnswersTo(OidcIdTokenCheck.MAX_ANSWER_BYTES);
		Login login = logIn(Map.of());

		OidcIdentity identity = exchange(login);

		assertThat(identity.subject()).isEqualTo(SUBJECT);
	}

	@Test
	void exchangeNamesTheProviderIdAndNoPartOfTheAnswerWhenTheKeyRequestFails() {
		IDP.answer(FakeIdp.keysUrlOf(ISSUER_URL), HttpStatus.INTERNAL_SERVER_ERROR, jsonHeaders(),
				"{\"error\": \"" + ANSWER_TEXT + "\"}");
		Login login = logIn(Map.of());

		Throwable failure = catchThrowable(() -> exchange(login));

		assertThat(failure).isExactlyInstanceOf(IdpErrorException.class).hasMessageContaining(PROVIDER_ID);
		messagesOf(failure).forEach(message -> assertThat(message).doesNotContain(ANSWER_TEXT, login.code()));
	}

	/**
	 * A new authorization request of core, as the start of a login makes it, and the login of the person at the IdP:
	 * the fake keeps a code for the request, and the ID token of the code gets the claims.
	 */
	private static Login logIn(Map<String, ?> claims) {
		OidcAuthorizationRequest authorization = OidcAuthorizationRequest.create(DOCUMENT, CLIENT_ID, REDIRECT_URI);
		String redirect = IDP.login(authorization.uri().toString(), SUBJECT, claims);
		return new Login(authorization, queryOf(redirect).get("code"));
	}

	private OidcIdentity exchange(Login login) {
		return exchange(DOCUMENT, login);
	}

	private OidcIdentity exchange(OidcDiscoveryDocument document, Login login) {
		var request = new OidcTokenRequest(PROVIDER_ID, document, CLIENT_ID, REDIRECT_URI,
				login.authorization().codeVerifier(), login.authorization().nonce());
		return check.exchange(request, login.code(), clientSecret.getBytes(StandardCharsets.UTF_8));
	}

	private static OidcDiscoveryDocument documentWith(String tokenEndpoint, String keyAddress) {
		return new OidcDiscoveryDocument(ISSUER_URL, URI.create(ISSUER_URL + FakeIdp.AUTHORIZATION_PATH),
				URI.create(tokenEndpoint), URI.create(keyAddress));
	}

	/** The message of the throwable and of each of its causes; a missing message is no text. */
	private static List<String> messagesOf(Throwable throwable) {
		List<String> messages = new ArrayList<>();
		for (Throwable current = throwable; current != null; current = current.getCause()) {
			if (current.getMessage() != null) {
				messages.add(current.getMessage());
			}
		}
		return messages;
	}

	private static HttpHeaders redirectTo(String target) {
		HttpHeaders headers = new HttpHeaders();
		headers.setLocation(URI.create(target));
		return headers;
	}

	private static HttpHeaders jsonHeaders() {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		return headers;
	}

	/**
	 * @param authorization the authorization request of core, with the PKCE verifier and the nonce
	 * @param code          the code that the IdP gave at the redirect URI
	 */
	private record Login(OidcAuthorizationRequest authorization, String code) {

	}

}

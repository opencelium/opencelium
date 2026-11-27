package io.opencelium.core.auth.oidc;

import java.net.URI;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import io.opencelium.core.testsupport.fake.FakeIdp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

/**
 * The OIDC client reads the discovery document of an issuer URL itself, within the limits of a call to an IdP: HTTPS
 * only, a size limit and no redirect. It accepts only a discovery document whose issuer is the issuer URL (OIDC
 * Discovery 1.0, section 4.3), and whose 3 endpoints of the authorization code flow each have an HTTPS address. An
 * error names the provider ID and never the body of the answer of the IdP. The fake IdP answers from memory, so the
 * timeout of a call is a part of the HTTP client, which its own test examines.
 */
class OidcDiscoveryTest {

	private static final String PROVIDER_ID = "staff-idp";

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	/** More than 100 times the size of the discovery document of a known IdP, which has a few kilobytes. */
	private static final int LARGE_DOCUMENT_CHARACTERS = 2 * 1024 * 1024;

	private final FakeIdp idp = new FakeIdp();

	private final OidcDiscovery discovery = new OidcDiscovery(idp);

	@Test
	void discoverGivesTheEndpointsOfTheDocumentWhenItsIssuerIsTheIssuerUrl() {
		idp.serveDiscoveryDocument(ISSUER_URL);

		OidcDiscoveryDocument document = discovery.discover(PROVIDER_ID, ISSUER_URL);

		assertThat(document).isEqualTo(new OidcDiscoveryDocument(ISSUER_URL,
				URI.create(ISSUER_URL + FakeIdp.AUTHORIZATION_PATH), URI.create(ISSUER_URL + FakeIdp.TOKEN_PATH),
				URI.create(ISSUER_URL + FakeIdp.KEYS_PATH)));
	}

	@Test
	void discoverGivesTheDocumentWhenTheIssuerUrlEndsWithASlash() {
		String issuerUrl = "https://tenant.idp.example.com/";
		idp.serveDiscoveryDocument(issuerUrl);

		OidcDiscoveryDocument document = discovery.discover(PROVIDER_ID, issuerUrl);

		assertThat(document.issuer()).isEqualTo(issuerUrl);
		assertThat(document.jwksUri()).isEqualTo(URI.create("https://tenant.idp.example.com" + FakeIdp.KEYS_PATH));
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWhenTheIdpAnswersNotFound() {
		idp.answer(FakeIdp.discoveryUrlOf(ISSUER_URL), HttpStatus.NOT_FOUND, htmlHeaders(), "<html>Not Found</html>");

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWhenTheIssuerOfTheDocumentIsAnotherUrl() {
		idp.serveDiscoveryDocument(ISSUER_URL, FakeIdp.documentOf("https://idp.example.com/realms/other"));

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@ParameterizedTest(name = "{0}")
	@ValueSource(strings = { "authorization_endpoint", "token_endpoint", "jwks_uri" })
	void discoverThrowsNoDiscoveryDocumentWhenTheDocumentHasNoEndpoint(String endpoint) {
		idp.serveDiscoveryDocument(ISSUER_URL, FakeIdp.documentWithout(ISSUER_URL, endpoint));

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@ParameterizedTest(name = "{0}")
	@ValueSource(strings = { "authorization_endpoint", "token_endpoint", "jwks_uri" })
	void discoverThrowsNoDiscoveryDocumentWhenAnEndpointOfTheDocumentHasNoHttps(String endpoint) {
		idp.serveDiscoveryDocument(ISSUER_URL,
				FakeIdp.documentOf(ISSUER_URL, Map.of(endpoint, "http://idp.example.com/realms/oc/endpoint")));

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@ParameterizedTest(name = "{0}")
	@ValueSource(strings = { "authorization_endpoint", "token_endpoint", "jwks_uri" })
	void discoverThrowsNoDiscoveryDocumentWhenThePortOfAnEndpointOfTheDocumentIsOutOfRange(String endpoint) {
		idp.serveDiscoveryDocument(ISSUER_URL,
				FakeIdp.documentOf(ISSUER_URL, Map.of(endpoint, "https://idp.example.com:99999/realms/oc/endpoint")));

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWhenTheAnswerIsJsonWithoutAnIssuer() {
		idp.serveDiscoveryDocument(ISSUER_URL, "{\"status\": \"up\"}");

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWhenTheAnswerIsNotJson() {
		idp.answer(FakeIdp.discoveryUrlOf(ISSUER_URL), HttpStatus.OK, htmlHeaders(),
				"<html>Log in to the Wi-Fi</html>");

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWhenTheIdpCannotBeReached() {
		idp.unreachable(FakeIdp.discoveryUrlOf(ISSUER_URL));

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWithoutARequestWhenTheIssuerUrlHasNoHttps() {
		String issuerUrl = "http://idp.example.com/realms/oc";
		idp.serveDiscoveryDocument(issuerUrl);

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, issuerUrl));
		assertThat(idp.requests()).isEmpty();
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWithoutARequestWhenThePortOfTheIssuerUrlIsOutOfRange() {
		String issuerUrl = "https://idp.example.com:99999/realms/oc";
		idp.serveDiscoveryDocument(issuerUrl);

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, issuerUrl));
		assertThat(idp.requests()).isEmpty();
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWithoutASecondRequestWhenTheIdpAnswersWithARedirect() {
		String movedUrl = "https://idp.example.com/moved" + FakeIdp.DISCOVERY_PATH;
		HttpHeaders redirect = jsonHeaders();
		redirect.setLocation(URI.create(movedUrl));
		// The body of the redirect and the target are documents of the issuer URL: only the redirect refuses them.
		idp.answer(FakeIdp.discoveryUrlOf(ISSUER_URL), HttpStatus.FOUND, redirect, FakeIdp.documentOf(ISSUER_URL));
		idp.answer(movedUrl, HttpStatus.OK, jsonHeaders(), FakeIdp.documentOf(ISSUER_URL));

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
		assertThat(idp.requests()).containsExactly(URI.create(FakeIdp.discoveryUrlOf(ISSUER_URL)));
	}

	@Test
	void discoverThrowsNoDiscoveryDocumentWhenTheDocumentIsLargerThanTheSizeLimit() {
		// A discovery document of the issuer URL in each other part: only its size refuses it.
		idp.serveDiscoveryDocument(ISSUER_URL,
				FakeIdp.documentOf(ISSUER_URL, Map.of("padding", "a".repeat(LARGE_DOCUMENT_CHARACTERS))));

		assertThatExceptionOfType(NoDiscoveryDocumentException.class)
			.isThrownBy(() -> discovery.discover(PROVIDER_ID, ISSUER_URL));
	}

	@Test
	void discoverNamesTheProviderIdAndNotTheBodyOfTheAnswerWhenTheIdpAnswersWithAnError() {
		String marker = newMarker();
		idp.answer(FakeIdp.discoveryUrlOf(ISSUER_URL), HttpStatus.INTERNAL_SERVER_ERROR, htmlHeaders(),
				"<html>Internal error " + marker + "</html>");

		assertRefusalNamesTheProviderIdAndNot(marker);
	}

	@Test
	void discoverNamesTheProviderIdAndNotTheBodyOfTheAnswerWhenTheAnswerIsNotJson() {
		String marker = newMarker();
		idp.answer(FakeIdp.discoveryUrlOf(ISSUER_URL), HttpStatus.OK, jsonHeaders(), marker + " is not JSON");

		assertRefusalNamesTheProviderIdAndNot(marker);
	}

	@Test
	void discoverNamesTheProviderIdAndNotTheBodyOfTheAnswerWhenTheIssuerOfTheDocumentIsAnotherUrl() {
		String marker = newMarker();
		idp.serveDiscoveryDocument(ISSUER_URL, FakeIdp.documentOf("https://" + marker + ".example.com/realms/oc"));

		assertRefusalNamesTheProviderIdAndNot(marker);
	}

	/**
	 * The discovery throws {@link NoDiscoveryDocumentException} with the provider ID in its message; the marker is in
	 * no message of the exception, of its causes or of their suppressed exceptions, so that no log line of the stack
	 * trace shows it.
	 */
	private void assertRefusalNamesTheProviderIdAndNot(String marker) {
		NoDiscoveryDocumentException refusal = catchThrowableOfType(NoDiscoveryDocumentException.class,
				() -> discovery.discover(PROVIDER_ID, ISSUER_URL));

		assertThat(refusal).as("the refusal of the answer").isNotNull().hasMessageContaining(PROVIDER_ID);
		forEachThrowable(refusal,
				throwable -> assertThat(String.valueOf(throwable.getMessage())).as("the message of %s", throwable)
					.doesNotContain(marker));
	}

	private static void forEachThrowable(Throwable throwable, Consumer<Throwable> action) {
		action.accept(throwable);
		for (Throwable suppressed : throwable.getSuppressed()) {
			forEachThrowable(suppressed, action);
		}
		if (throwable.getCause() != null && throwable.getCause() != throwable) {
			forEachThrowable(throwable.getCause(), action);
		}
	}

	/** A new random text, so that a test finds the body of the answer of the IdP in a message. */
	private static String newMarker() {
		return "marker" + UUID.randomUUID().toString().replace("-", "");
	}

	private static HttpHeaders jsonHeaders() {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		return headers;
	}

	private static HttpHeaders htmlHeaders() {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.TEXT_HTML);
		return headers;
	}

}

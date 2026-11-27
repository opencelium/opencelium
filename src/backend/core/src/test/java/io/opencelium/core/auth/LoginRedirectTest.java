package io.opencelium.core.auth;

import java.nio.file.Path;
import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.settings.SettingReader;
import io.opencelium.core.testsupport.fake.FakeIdp;

import static io.opencelium.core.testsupport.OidcLoginRequests.LOGIN_PATH;
import static io.opencelium.core.testsupport.OidcLoginRequests.LOGIN_VERIFIER_HASH;
import static io.opencelium.core.testsupport.OidcLoginRequests.assertErrorRedirect;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifierHash;
import static io.opencelium.core.testsupport.OidcLoginRequests.start;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.BDDMockito.given;

/**
 * The start of an OIDC login sends each error to the frontend as a redirect to the fixed path {@code /login/oidc} of
 * the origin of core, with the error code after the {@code #}: no host, no body, no message text and no value of the
 * request. No parameter and no header of the request changes the target.
 * <p>
 * The slice has the endpoint of the start, the beans of the OIDC login strategy with the fake IdP as the HTTP client
 * of the calls to an IdP, and the OIDC providers {@code kc} and {@code kc-down} of the self-host mode. The fake IdP
 * serves the discovery document of {@code kc} and never one of {@code kc-down}. The slice has no security filter chain
 * and no tenant: the full-application tests show that the endpoint is open, and the login records. No case of the
 * slice reaches the login record of a start.
 */
@WebMvcTest(controllers = OidcLoginController.class,
		// The application has no Spring Security user with a generated password, and the slice has none too.
		excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class,
		// The tenant filter needs the tenant runner, and the slice runs without filters.
		excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX, pattern = "io\\.opencelium\\.core\\.tenant\\..*"))
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Import(OidcConfig.class)
class LoginRedirectTest {

	private static final String KEY = "oidc.providers";

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	/** An issuer URL whose discovery document the fake IdP never serves. */
	private static final String DOWN_ISSUER_URL = "https://down-idp.example.com/realms/oc";

	private static final String ATTACKER = "https://attacker.example.com";

	private static final String ATTACKER_HOST = "attacker.example.com";

	private static final FakeIdp IDP = new FakeIdp();

	@TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
	ClientHttpRequestFactory oidcRequestFactory;

	@MockitoBean
	SettingReader settings;

	@MockitoBean
	OidcLoginRepository logins;

	@Autowired
	MockMvcTester mvc;

	static ClientHttpRequestFactory fakeIdp() {
		return IDP;
	}

	@BeforeEach
	void storeTheProviders() {
		given(settings.items(KEY)).willReturn(List.of(provider("kc", ISSUER_URL), provider("kc-down", DOWN_ISSUER_URL)));
	}

	@BeforeEach
	void serveTheDiscoveryDocumentOfKc() {
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
	}

	@Test
	void loginRedirectsToTheErrorTargetOfUnknownProviderWhenNoProviderHasTheProviderId() {
		MvcTestResult start = start(mvc, "other", newLoginVerifierHash());

		assertErrorRedirect(start, "unknown-provider");
	}

	@ParameterizedTest
	@ValueSource(strings = {"KC", "kc_1", "-kc", "kc-", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"})
	void loginRedirectsToTheErrorTargetOfUnknownProviderWhenTheProviderIdHasAnInvalidForm(String providerId) {
		MvcTestResult start = start(mvc, providerId, newLoginVerifierHash());

		assertErrorRedirect(start, "unknown-provider");
	}

	@Test
	void loginRedirectsToTheErrorTargetOfBadRequestWhenTheRequestHasNoHash() {
		MvcTestResult start = mvc.get().uri(LOGIN_PATH, "kc").exchange();

		assertErrorRedirect(start, "bad-request");
	}

	@ParameterizedTest
	@MethodSource("hashesOfAnotherForm")
	void loginRedirectsToTheErrorTargetOfBadRequestWhenTheHashIsNotABase64UrlSha256(String loginVerifierHash) {
		MvcTestResult start = start(mvc, "kc", loginVerifierHash);

		assertErrorRedirect(start, "bad-request");
	}

	@Test
	void loginRedirectsToTheErrorTargetOfIdpErrorWhenTheIdpGivesNoDiscoveryDocument() {
		MvcTestResult start = start(mvc, "kc-down", newLoginVerifierHash());

		assertErrorRedirect(start, "idp-error");
	}

	@ParameterizedTest(name = "{2}")
	@MethodSource("errorsOfTheStart")
	void loginKeepsTheErrorTargetWhenTheRequestNamesAnotherTargetOrAnotherHost(String providerId,
			String loginVerifierHash, String errorCode) {
		var request = mvc.get().uri(LOGIN_PATH, providerId)
			.param("redirect_uri", ATTACKER + "/login/oidc")
			.param("target", ATTACKER)
			.param("redirect", ATTACKER)
			.param("return_to", ATTACKER)
			.param("next", ATTACKER)
			.header(HttpHeaders.HOST, ATTACKER_HOST)
			.header("Forwarded", "proto=https;host=" + ATTACKER_HOST)
			.header("X-Forwarded-Host", ATTACKER_HOST)
			.header("X-Forwarded-Proto", "https")
			.header("X-Forwarded-Prefix", "/elsewhere")
			.header(HttpHeaders.ORIGIN, ATTACKER)
			.header(HttpHeaders.REFERER, ATTACKER + "/");
		if (loginVerifierHash != null) {
			request = request.param(LOGIN_VERIFIER_HASH, loginVerifierHash);
		}

		MvcTestResult start = request.exchange();

		assertErrorRedirect(start, errorCode);
	}

	/**
	 * Values that are not 43 characters of the base64url alphabet: empty, 1 character too short or too long, a
	 * character of the standard base64 alphabet, padding, and the hexadecimal form of a SHA-256 digest.
	 */
	static Stream<String> hashesOfAnotherForm() {
		String valid = newLoginVerifierHash();
		return Stream.of("", valid.substring(1), valid + "A", "+" + valid.substring(1), "/" + valid.substring(1),
				valid.substring(1) + "=", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
	}

	/** The provider ID, the hash of the login verifier or none, and the error code of each error of the start. */
	static Stream<Arguments> errorsOfTheStart() {
		return Stream.of(arguments("other", newLoginVerifierHash(), "unknown-provider"),
				arguments("kc", null, "bad-request"), arguments("kc-down", newLoginVerifierHash(), "idp-error"));
	}

	/** An OIDC provider as the setting gives it to a feature: the client secret is a secret reference. */
	private static Map<String, Object> provider(String id, String issuerUrl) {
		Map<String, Object> provider = new LinkedHashMap<>();
		provider.put("id", id);
		provider.put("display-name", "Keycloak");
		provider.put("issuer-url", issuerUrl);
		provider.put("client-id", "core");
		provider.put("client-secret", new SecretReference(TenantId.SYSTEM, UUID.randomUUID().toString()));
		provider.put("email-link", false);
		return provider;
	}

	/** The beans of the start that the slice does not scan: the deployment mode and the clock. */
	@TestConfiguration(proxyBeanMethods = false)
	static class Bootstrap {

		@Bean
		OpenCeliumProperties openCeliumProperties() {
			return new OpenCeliumProperties(DeploymentMode.SELF_HOST, Path.of(System.getProperty("java.io.tmpdir")),
					Optional.empty());
		}

		@Bean
		Clock clock() {
			return Clock.systemUTC();
		}

	}

}

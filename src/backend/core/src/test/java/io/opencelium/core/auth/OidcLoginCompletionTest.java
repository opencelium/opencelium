package io.opencelium.core.auth;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.auth.oidc.OidcDiscoveryCache;
import io.opencelium.core.auth.oidc.OidcDiscoveryDocument;
import io.opencelium.core.auth.oidc.OidcIdTokenCheck;
import io.opencelium.core.auth.oidc.OidcIdentity;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.settings.SettingReader;
import io.opencelium.core.user.UserDocument;
import io.opencelium.core.user.UserService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * The completion of an OIDC login refuses an answer of the IdP without a state, or with a state of another form,
 * before a read of the login record, and an answer without a code before the first request to the IdP. It zeroes the
 * bytes of the client secret after the token request, also when the request fails. The collaborators are mocks: the
 * full-application tests show the complete login.
 */
@ExtendWith(MockitoExtension.class)
class OidcLoginCompletionTest {

	private static final String PROVIDER_ID = "kc";

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	/** A state as core makes it: 43 characters of the base64url alphabet. */
	private static final String STATE = "A".repeat(43);

	private static final String REDIRECT_URI = "https://oc.example.com/api/auth/oidc/kc/callback";

	private static final Instant NOW = Instant.parse("2026-11-27T10:00:00Z");

	private static final SecretReference CLIENT_SECRET = new SecretReference(TenantId.SYSTEM, "secret-of-kc");

	@Mock
	SettingReader settings;

	@Mock
	SecretProvider secrets;

	@Mock
	OidcDiscoveryCache discovery;

	@Mock
	OidcIdTokenCheck idTokens;

	@Mock
	OidcLoginRepository logins;

	@Mock
	UserService users;

	@Mock
	SessionService sessions;

	private OidcLoginCompletion completion;

	@BeforeEach
	void makeTheCompletion() {
		var properties = new OpenCeliumProperties(DeploymentMode.SELF_HOST,
				Path.of(System.getProperty("java.io.tmpdir")), Optional.empty());
		completion = new OidcLoginCompletion(properties, settings, secrets, discovery, idTokens, logins, users,
				sessions, Clock.fixed(NOW, ZoneOffset.UTC));
		given(settings.items(OidcProviders.KEY)).willReturn(List.of(provider()));
	}

	@Test
	void completeRefusesWithLoginExpiredWithoutAReadOfTheLoginRecordWhenTheAnswerHasNoState() {
		OidcLoginOutcome outcome = completion.complete(PROVIDER_ID, null, "code-of-the-idp", null, REDIRECT_URI);

		assertThat(outcome).isEqualTo(new OidcLoginOutcome.Refused(OidcLoginError.LOGIN_EXPIRED));
		verifyNoInteractions(logins, idTokens);
	}

	@Test
	void completeRefusesWithLoginExpiredWithoutAReadOfTheLoginRecordWhenTheStateHasAnotherForm() {
		OidcLoginOutcome outcome = completion.complete(PROVIDER_ID, "state-of-another-form", "code-of-the-idp", null,
				REDIRECT_URI);

		assertThat(outcome).isEqualTo(new OidcLoginOutcome.Refused(OidcLoginError.LOGIN_EXPIRED));
		verifyNoInteractions(logins, idTokens);
	}

	@Test
	void completeRefusesWithIdpErrorWithoutARequestToTheIdpWhenTheAnswerHasNoCode() {
		given(logins.take(PROVIDER_ID, STATE)).willReturn(Optional.of(login()));

		OidcLoginOutcome outcome = completion.complete(PROVIDER_ID, STATE, null, null, REDIRECT_URI);

		assertThat(outcome).isEqualTo(new OidcLoginOutcome.Refused(OidcLoginError.IDP_ERROR));
		verifyNoInteractions(discovery, secrets, idTokens);
	}

	@Test
	void completeZeroesTheClientSecretWhenTheIdTokenIsCorrect() {
		byte[] clientSecret = "client-secret-of-kc".getBytes(StandardCharsets.UTF_8);
		given(logins.take(PROVIDER_ID, STATE)).willReturn(Optional.of(login()));
		given(discovery.discover(PROVIDER_ID, ISSUER_URL)).willReturn(document());
		given(secrets.read(CLIENT_SECRET)).willReturn(clientSecret);
		given(idTokens.exchange(any(), any(), any())).willReturn(new OidcIdentity(ISSUER_URL, "alice", null, false));
		UserDocument user = new UserDocument("user-1", TenantId.SELF_HOST.value(), "kc-alice", null, null, Set.of(),
				false, null, false, false, NOW);
		given(users.findOrCreateByOidcLink(any(), any())).willReturn(user);
		given(sessions.startForLoginCode(user, "hash-of-the-login-verifier")).willReturn("login-code");

		OidcLoginOutcome outcome = completion.complete(PROVIDER_ID, STATE, "code-of-the-idp", null, REDIRECT_URI);

		assertThat(outcome).isEqualTo(new OidcLoginOutcome.LoginCode("login-code"));
		assertThat(clientSecret).as("the bytes of the client secret").containsOnly(0);
	}

	@Test
	void completeZeroesTheClientSecretWhenTheTokenRequestStopsWithAnError() {
		byte[] clientSecret = "client-secret-of-kc".getBytes(StandardCharsets.UTF_8);
		given(logins.take(PROVIDER_ID, STATE)).willReturn(Optional.of(login()));
		given(discovery.discover(PROVIDER_ID, ISSUER_URL)).willReturn(document());
		given(secrets.read(CLIENT_SECRET)).willReturn(clientSecret);
		given(idTokens.exchange(any(), any(), any())).willThrow(new IllegalStateException("The call stopped."));

		assertThatIllegalStateException()
			.isThrownBy(() -> completion.complete(PROVIDER_ID, STATE, "code-of-the-idp", null, REDIRECT_URI));

		assertThat(clientSecret).as("the bytes of the client secret").containsOnly(0);
	}

	/** An OIDC provider as the setting gives it to a feature: the client secret is a secret reference. */
	private static Map<String, Object> provider() {
		Map<String, Object> provider = new LinkedHashMap<>();
		provider.put("id", PROVIDER_ID);
		provider.put("display-name", "Keycloak");
		provider.put("issuer-url", ISSUER_URL);
		provider.put("client-id", "core");
		provider.put("client-secret", CLIENT_SECRET);
		provider.put("email-link", false);
		return provider;
	}

	/** A login record of the OIDC provider that did not end yet. */
	private static OidcLoginRecord login() {
		return new OidcLoginRecord("login-1", TenantId.SELF_HOST.value(), PROVIDER_ID, STATE, "nonce",
				"code-verifier", "hash-of-the-login-verifier", NOW.plusSeconds(60));
	}

	private static OidcDiscoveryDocument document() {
		return new OidcDiscoveryDocument(ISSUER_URL, URI.create(ISSUER_URL + "/authorize"),
				URI.create(ISSUER_URL + "/token"), URI.create(ISSUER_URL + "/keys"));
	}

}

package io.opencelium.core.auth;

import java.time.Clock;
import java.util.Arrays;
import java.util.Optional;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.stereotype.Service;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.core.auth.oidc.IdpErrorException;
import io.opencelium.core.auth.oidc.InvalidIdTokenException;
import io.opencelium.core.auth.oidc.NoDiscoveryDocumentException;
import io.opencelium.core.auth.oidc.OidcAuthorizationRequest;
import io.opencelium.core.auth.oidc.OidcDiscoveryCache;
import io.opencelium.core.auth.oidc.OidcDiscoveryDocument;
import io.opencelium.core.auth.oidc.OidcIdTokenCheck;
import io.opencelium.core.auth.oidc.OidcIdentity;
import io.opencelium.core.auth.oidc.OidcTokenRequest;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.settings.SettingReader;
import io.opencelium.core.user.UserDocument;
import io.opencelium.core.user.UserService;

/**
 * Completes an OIDC login at the answer of the IdP: it reads and deletes the login record of the state, gets the ID
 * token for the code of the IdP and checks it, finds or makes the OpenCelium user of the ID token, starts a session
 * and issues its login code. A refused answer starts no session.
 * <p>
 * The checks run in this order, and the first that fails gives the error:
 * <ol>
 * <li>The deployment mode must have the OIDC login strategy, and the provider ID must have the form of one and name an
 * OIDC provider: else {@code unknown-provider}. In the cloud mode core reads no setting and no tenant document, and it
 * makes no request to an IdP.</li>
 * <li>The state must have the form of a state that core makes, and it must name a login record of that OIDC provider,
 * which core reads and deletes in 1 operation, and the login must not have ended: else {@code login-expired}. A state of
 * another form causes no read of the database. A second answer finds no record. The record of another OIDC provider
 * stays.</li>
 * <li>The answer must have no error and must have a code: else {@code idp-error}. A discovery document, a token request
 * and a request of the public keys that fail also give {@code idp-error}.</li>
 * <li>The ID token must pass its checks: else {@code invalid-id-token}.</li>
 * </ol>
 * Each refusal writes 1 line to the log with the code and a fixed reason. The line names the provider ID only after the
 * check of its form, and it never has the state, the code, a token, the nonce, the PKCE verifier, the client secret or a
 * part of an answer of the IdP. Core reads the client secret from the secret provider just before the token request,
 * and zeroes its bytes after it, also when the request fails.
 */
@Service
class OidcLoginCompletion {

	private static final Log log = LogFactory.getLog(OidcLoginCompletion.class);

	private final DeploymentMode mode;

	private final SettingReader settings;

	private final SecretProvider secrets;

	private final OidcDiscoveryCache discovery;

	private final OidcIdTokenCheck idTokens;

	private final OidcLoginRepository logins;

	private final UserService users;

	private final SessionService sessions;

	private final Clock clock;

	OidcLoginCompletion(OpenCeliumProperties properties, SettingReader settings, SecretProvider secrets,
			OidcDiscoveryCache discovery, OidcIdTokenCheck idTokens, OidcLoginRepository logins, UserService users,
			SessionService sessions, Clock clock) {
		this.mode = properties.deploymentMode();
		this.settings = settings;
		this.secrets = secrets;
		this.discovery = discovery;
		this.idTokens = idTokens;
		this.logins = logins;
		this.users = users;
		this.sessions = sessions;
		this.clock = clock;
	}

	/**
	 * @param providerId  the provider ID of the path of the redirect URI
	 * @param state       the state of the answer, or {@code null} when the answer has none
	 * @param code        the code of the IdP, or {@code null} when the answer has none
	 * @param error       the error code of the IdP, or {@code null} when the answer has none
	 * @param redirectUri the redirect URI at which the IdP answered, for the token request
	 * @return the login code of the new session, or the error that refuses the answer
	 */
	OidcLoginOutcome complete(String providerId, String state, String code, String error, String redirectUri) {
		return switch (mode) {
			case SELF_HOST -> completeInSelfHost(providerId, state, code, error, redirectUri);
			case CLOUD -> refuse(OidcLoginError.UNKNOWN_PROVIDER, "the cloud mode has no OIDC login strategy.");
		};
	}

	private OidcLoginOutcome completeInSelfHost(String providerId, String state, String code, String error,
			String redirectUri) {
		if (!OidcProviders.isProviderId(providerId)) {
			return refuse(OidcLoginError.UNKNOWN_PROVIDER, "the provider ID has no valid form.");
		}
		Optional<OidcProvider> found = OidcProvider.find(settings.items(OidcProviders.KEY), providerId);
		if (found.isEmpty() || found.get().clientSecret() == null) {
			return refuse(OidcLoginError.UNKNOWN_PROVIDER,
					"no OIDC provider with a client secret has the provider ID " + providerId + ".");
		}
		OidcProvider provider = found.get();
		if (!OidcAuthorizationRequest.hasStateForm(state)) {
			return refuse(OidcLoginError.LOGIN_EXPIRED,
					"the answer for the OIDC provider " + providerId + " has no state of the form that core makes.");
		}
		Optional<OidcLoginRecord> login = logins.take(providerId, state);
		if (login.isEmpty()) {
			return refuse(OidcLoginError.LOGIN_EXPIRED,
					"the state of the answer names no login of the OIDC provider " + providerId + ".");
		}
		if (!clock.instant().isBefore(login.get().expiresAt())) {
			return refuse(OidcLoginError.LOGIN_EXPIRED,
					"the login of the OIDC provider " + providerId + " ended before the answer.");
		}
		if (error != null) {
			return refuse(OidcLoginError.IDP_ERROR,
					"the IdP of the OIDC provider " + providerId + " answered with an error.");
		}
		if (code == null || code.isEmpty()) {
			return refuse(OidcLoginError.IDP_ERROR,
					"the answer of the IdP of the OIDC provider " + providerId + " has no code.");
		}
		OidcDiscoveryDocument document;
		try {
			document = discovery.discover(providerId, provider.issuerUrl());
		}
		catch (NoDiscoveryDocumentException ex) {
			return refuse(OidcLoginError.IDP_ERROR, ex.getMessage());
		}
		var request = new OidcTokenRequest(providerId, document, provider.clientId(), redirectUri,
				login.get().codeVerifier(), login.get().nonce());
		OidcIdentity identity;
		byte[] clientSecret = secrets.read(provider.clientSecret());
		try {
			identity = idTokens.exchange(request, code, clientSecret);
		}
		catch (IdpErrorException ex) {
			return refuse(OidcLoginError.IDP_ERROR, ex.getMessage());
		}
		catch (InvalidIdTokenException ex) {
			return refuse(OidcLoginError.INVALID_ID_TOKEN, ex.getMessage());
		}
		finally {
			Arrays.fill(clientSecret, (byte) 0);
		}
		UserDocument user = users.findOrCreateByOidcLink(providerId, identity);
		return new OidcLoginOutcome.LoginCode(sessions.startForLoginCode(user, login.get().loginVerifierHash()));
	}

	/** The refusal of the answer and the line of the log. The reason is a fixed text, or the message of an error. */
	private static OidcLoginOutcome refuse(OidcLoginError error, String reason) {
		log.info("The answer of an OIDC login is refused with the code " + error.code() + ": " + reason);
		return new OidcLoginOutcome.Refused(error);
	}

}

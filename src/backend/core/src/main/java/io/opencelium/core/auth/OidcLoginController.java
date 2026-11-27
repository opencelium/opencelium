package io.opencelium.core.auth;

import java.time.Clock;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.auth.oidc.NoDiscoveryDocumentException;
import io.opencelium.core.auth.oidc.OidcAuthorizationRequest;
import io.opencelium.core.auth.oidc.OidcDiscoveryCache;
import io.opencelium.core.auth.oidc.OidcDiscoveryDocument;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.settings.SettingReader;

/**
 * The start of an OIDC login: the browser opens the login of an OIDC provider with the SHA-256 hash of the login
 * verifier of the HTTP client, and core redirects it to the login page of the IdP. Core keeps 1 login record for each
 * started login. An error redirects the browser to the login page of the frontend with an error code
 * ({@link OidcLoginError}) and keeps no login record.
 * <p>
 * The redirect URI at the IdP is the callback path of the OIDC provider with the scheme, the host and the port of the
 * request, without the default port of the scheme. The request has those parts of the address that the servlet
 * container gives: a proxy changes them only when the Spring property of the forwarded headers permits it.
 * <p>
 * The cloud mode has no OIDC login strategy, so each start is an unknown OIDC provider there. Core then reads no
 * setting, no tenant document and makes no request to an IdP. Each refused start writes 1 line to the log with the
 * reason. The line names the provider ID only after the check of its form, so a request cannot put free text into the
 * log, and it never has the hash, the state, the nonce, the PKCE verifier or a part of an answer of the IdP.
 */
@RestController
final class OidcLoginController {

	static final String PATH = "/api/auth/oidc/{providerId}/login";

	/** The path of the redirect URI of an OIDC provider, at which the IdP answers. */
	static final String CALLBACK_PATH = "/api/auth/oidc/{providerId}/callback";

	static final String LOGIN_VERIFIER_HASH = "login-verifier-hash";

	/** SHA-256 in the base64url form without padding: 32 bytes are 43 characters. */
	private static final Pattern HASH_FORM = Pattern.compile("[A-Za-z0-9_-]{43}");

	private static final Log log = LogFactory.getLog(OidcLoginController.class);

	private final DeploymentMode mode;

	private final SettingReader settings;

	private final OidcDiscoveryCache discovery;

	private final OidcLoginRepository logins;

	private final Clock clock;

	OidcLoginController(OpenCeliumProperties properties, SettingReader settings, OidcDiscoveryCache discovery,
			OidcLoginRepository logins, Clock clock) {
		this.mode = properties.deploymentMode();
		this.settings = settings;
		this.discovery = discovery;
		this.logins = logins;
		this.clock = clock;
	}

	@GetMapping(PATH)
	ResponseEntity<Void> login(@PathVariable("providerId") String providerId,
			@RequestParam(name = LOGIN_VERIFIER_HASH, required = false) String loginVerifierHash,
			HttpServletRequest request) {
		return switch (mode) {
			case SELF_HOST -> start(providerId, loginVerifierHash, request);
			case CLOUD -> refuse(OidcLoginError.UNKNOWN_PROVIDER, "the cloud mode has no OIDC login strategy.");
		};
	}

	/**
	 * Checks the form of the provider ID and of the hash before any read of a setting, finds the OIDC provider, reads
	 * its discovery document, keeps the login record and redirects the browser to the IdP. The login record is the
	 * last step before the redirect, so a refused start keeps none.
	 */
	private ResponseEntity<Void> start(String providerId, String loginVerifierHash, HttpServletRequest request) {
		if (!OidcProviders.isProviderId(providerId)) {
			return refuse(OidcLoginError.UNKNOWN_PROVIDER, "the provider ID has no valid form.");
		}
		if (loginVerifierHash == null || !HASH_FORM.matcher(loginVerifierHash).matches()) {
			return refuse(OidcLoginError.BAD_REQUEST,
					"the hash of the login verifier is missing or not valid for the OIDC provider " + providerId + ".");
		}
		Optional<Provider> provider = find(providerId);
		if (provider.isEmpty()) {
			return refuse(OidcLoginError.UNKNOWN_PROVIDER,
					"no OIDC provider has the provider ID " + providerId + ".");
		}
		OidcDiscoveryDocument document;
		try {
			document = discovery.discover(providerId, provider.get().issuerUrl());
		}
		catch (NoDiscoveryDocumentException ex) {
			return refuse(OidcLoginError.IDP_ERROR, ex.getMessage());
		}
		OidcAuthorizationRequest authorization = OidcAuthorizationRequest.create(document, provider.get().clientId(),
				redirectUri(request, providerId));
		logins.insert(new OidcLoginRecord(null, TenantId.SELF_HOST.value(), providerId, authorization.state(),
				authorization.nonce(), authorization.codeVerifier(), loginVerifierHash,
				clock.instant().plus(OidcLoginRecord.LIFE)));
		return ResponseEntity.status(HttpStatus.FOUND).location(authorization.uri()).build();
	}

	/** The OIDC provider of the setting with the provider ID; an item without text for the 2 values has no use. */
	private Optional<Provider> find(String providerId) {
		for (Map<String, Object> item : settings.items(OidcProviders.KEY)) {
			if (providerId.equals(item.get(OidcProviders.ID)) && item.get(OidcProviders.ISSUER_URL) instanceof String
					issuerUrl && item.get(OidcProviders.CLIENT_ID) instanceof String clientId) {
				return Optional.of(new Provider(issuerUrl, clientId));
			}
		}
		return Optional.empty();
	}

	/** The scheme, the host and the port of the request, without the default port, then the callback path. */
	private static String redirectUri(HttpServletRequest request, String providerId) {
		return ServletUriComponentsBuilder.fromContextPath(request)
			.path(CALLBACK_PATH)
			.buildAndExpand(providerId)
			.toUriString();
	}

	/**
	 * The redirect of the browser to the frontend with the error code, and the line of the log. The reason is a fixed
	 * text. It names the provider ID only when the caller checked the form of the ID, and it holds no other value of
	 * the request.
	 */
	private static ResponseEntity<Void> refuse(OidcLoginError error, String reason) {
		log.info("The start of an OIDC login is refused with the code " + error.code() + ": " + reason);
		return ResponseEntity.status(HttpStatus.FOUND).location(error.target()).build();
	}

	/** The values of an OIDC provider that the start uses; the start needs no client secret. */
	private record Provider(String issuerUrl, String clientId) {

	}

}

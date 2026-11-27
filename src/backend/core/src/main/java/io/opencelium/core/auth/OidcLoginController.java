package io.opencelium.core.auth;

import java.time.Clock;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.opencelium.core.auth.oidc.OidcDiscovery;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.settings.SettingReader;

/**
 * The start of an OIDC login: the browser opens the login of an OIDC provider with the SHA-256 hash of the login
 * verifier of the HTTP client, and core redirects it to the login page of the IdP. Core keeps 1 login record for each
 * started login. An error redirects the browser to the login page of the frontend with an error code.
 */
@RestController
final class OidcLoginController {

	static final String PATH = "/api/auth/oidc/{providerId}/login";

	static final String LOGIN_VERIFIER_HASH = "login-verifier-hash";

	private final OpenCeliumProperties properties;

	private final SettingReader settings;

	private final OidcDiscovery discovery;

	private final OidcLoginRepository logins;

	private final Clock clock;

	OidcLoginController(OpenCeliumProperties properties, SettingReader settings, OidcDiscovery discovery,
			OidcLoginRepository logins, Clock clock) {
		this.properties = properties;
		this.settings = settings;
		this.discovery = discovery;
		this.logins = logins;
		this.clock = clock;
	}

	@GetMapping(PATH)
	ResponseEntity<Void> login(@PathVariable("providerId") String providerId,
			@RequestParam(name = LOGIN_VERIFIER_HASH, required = false) String loginVerifierHash,
			HttpServletRequest request) {
		throw new UnsupportedOperationException("The start of an OIDC login is not implemented yet.");
	}

}

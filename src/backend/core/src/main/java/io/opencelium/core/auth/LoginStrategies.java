package io.opencelium.core.auth;

import java.util.List;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import io.opencelium.core.config.DeploymentMode;

/**
 * The login strategies of the deployment mode, as authentication providers of Spring Security. The self-host mode has
 * the local login strategy: the password of an OpenCelium user in the database of core. The cloud mode has none,
 * because only the Service Portal authenticates a person there; a login then fails for each name and each password.
 */
final class LoginStrategies {

	private final DeploymentMode mode;

	private final UserDetailsService userLookup;

	private final PasswordEncoder passwordEncoder;

	/**
	 * @param userLookup      finds the OpenCelium user of the name of a login
	 * @param passwordEncoder compares the password of a login with the password hash of the user
	 */
	LoginStrategies(DeploymentMode mode, UserDetailsService userLookup, PasswordEncoder passwordEncoder) {
		this.mode = mode;
		this.userLookup = userLookup;
		this.passwordEncoder = passwordEncoder;
	}

	/** The providers of the deployment mode; empty in the cloud mode. */
	List<AuthenticationProvider> providers() {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

}

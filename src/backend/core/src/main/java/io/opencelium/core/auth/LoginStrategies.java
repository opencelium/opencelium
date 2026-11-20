package io.opencelium.core.auth;

import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import io.opencelium.core.config.DeploymentMode;

/**
 * The login strategies of the deployment mode, as authentication providers of Spring Security. The self-host mode has
 * the local login strategy: the password of an OpenCelium user in the database of core. The cloud mode has none,
 * because only the Service Portal authenticates a person there; a login then fails for each name and each password.
 * <p>
 * The local login strategy is the password provider of Spring Security. For a name that no user has, it compares the
 * password with a fixed hash, so that the time of the answer does not show which names exist.
 */
final class LoginStrategies {

	/** The authentication of a deployment mode without a login strategy: each attempt fails. */
	private static final AuthenticationManager NO_LOGIN_STRATEGY = attempt -> {
		throw new BadCredentialsException("No login strategy of this deployment mode accepts a password.");
	};

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

	/** The providers of the deployment mode; empty in the cloud mode. A switch, so a new mode needs its own rule. */
	List<AuthenticationProvider> providers() {
		return switch (mode) {
			case SELF_HOST -> List.of(localLoginStrategy());
			case CLOUD -> List.of();
		};
	}

	/** The providers of the deployment mode in 1 authentication manager, for the login endpoint. */
	AuthenticationManager authenticationManager() {
		List<AuthenticationProvider> providers = providers();
		return providers.isEmpty() ? NO_LOGIN_STRATEGY : new ProviderManager(providers);
	}

	private AuthenticationProvider localLoginStrategy() {
		var provider = new DaoAuthenticationProvider(userLookup);
		provider.setPasswordEncoder(passwordEncoder);
		return provider;
	}

}

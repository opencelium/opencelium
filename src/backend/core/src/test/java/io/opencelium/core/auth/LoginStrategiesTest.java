package io.opencelium.core.auth;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import io.opencelium.core.config.DeploymentMode;

import static org.assertj.core.api.Assertions.assertThat;

/** The self-host mode logs in an OpenCelium user with the password; the cloud mode has no login strategy here. */
class LoginStrategiesTest {

	private static final PasswordEncoder PASSWORD_ENCODER = PasswordEncoderFactories.createDelegatingPasswordEncoder();

	private static final String PASSWORD = "Alice-Password-1";

	private final String passwordHash = PASSWORD_ENCODER.encode(PASSWORD);

	private final UserDetailsService userLookup = name -> {
		if (!name.equals("alice")) {
			throw new UsernameNotFoundException("No such user.");
		}
		return User.withUsername("alice").password(passwordHash).build();
	};

	@Test
	void providersHaveTheLocalLoginStrategyWhenTheModeIsSelfHost() {
		List<AuthenticationProvider> providers = new LoginStrategies(DeploymentMode.SELF_HOST, userLookup,
				PASSWORD_ENCODER).providers();

		Authentication login = new ProviderManager(providers)
				.authenticate(UsernamePasswordAuthenticationToken.unauthenticated("alice", PASSWORD));

		assertThat(login.isAuthenticated()).isTrue();
		assertThat(login.getName()).isEqualTo("alice");
	}

	@Test
	void providersAreEmptyWhenTheModeIsCloud() {
		assertThat(new LoginStrategies(DeploymentMode.CLOUD, userLookup, PASSWORD_ENCODER).providers()).isEmpty();
	}

}

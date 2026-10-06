package io.opencelium.core.user;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration(proxyBeanMethods = false)
public class PasswordConfig {

	/**
	 * BCrypt for new hashes. Each hash is stored with its algorithm prefix ({@code {bcrypt}...}), so a later default
	 * such as Argon2 (needs BouncyCastle) verifies old hashes without a data migration.
	 */
	@Bean
	PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

}

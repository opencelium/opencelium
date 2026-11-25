package io.opencelium.core.authz;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import io.opencelium.core.config.OpenCeliumProperties;

/**
 * The access control of core: the method security of Spring Security, and the permission rules that an endpoint
 * names with an annotation. The authentication gives each role of the user as an authority; the rules here read the
 * authorities, so no security filter and no feature examines a role.
 */
@Configuration(proxyBeanMethods = false)
@EnableMethodSecurity
class AuthzConfig {

	/** The name of the bean of {@link InstallationAdmin}; the expression of {@link InstallationAdminOnly} uses it. */
	static final String INSTALLATION_ADMIN = "installationAdmin";

	@Bean(INSTALLATION_ADMIN)
	InstallationAdmin installationAdmin(OpenCeliumProperties properties) {
		return new InstallationAdmin(properties.deploymentMode());
	}

}

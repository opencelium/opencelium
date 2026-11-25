package io.opencelium.core.authz;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import io.opencelium.core.config.DeploymentMode;

/**
 * The permission rule for the settings of the whole installation. In the self-host mode an OpenCelium user with the
 * role {@code ADMIN} passes it. In the cloud mode no OpenCelium user passes it, because a change would apply to each
 * tenant of the installation.
 */
public final class InstallationAdmin {

	/** The authority that the authentication gives a user with the role {@code ADMIN}. */
	static final String ADMIN_AUTHORITY = Roles.authorityOf(Roles.ADMIN);

	private final DeploymentMode deploymentMode;

	public InstallationAdmin(DeploymentMode deploymentMode) {
		this.deploymentMode = deploymentMode;
	}

	/** @return {@code true} when the login of the request passes the rule */
	public boolean check(Authentication authentication) {
		return deploymentMode == DeploymentMode.SELF_HOST && authentication != null
				&& authentication.isAuthenticated() && authentication.getAuthorities().stream()
					.map(GrantedAuthority::getAuthority).anyMatch(ADMIN_AUTHORITY::equals);
	}

}

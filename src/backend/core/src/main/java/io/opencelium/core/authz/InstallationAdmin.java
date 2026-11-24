package io.opencelium.core.authz;

import org.springframework.security.core.Authentication;

import io.opencelium.core.config.DeploymentMode;

/**
 * The permission rule for the settings of the whole installation. In the self-host mode an OpenCelium user with the
 * role {@code ADMIN} passes it. In the cloud mode no OpenCelium user passes it, because a change would apply to each
 * tenant of the installation.
 */
public final class InstallationAdmin {

	public InstallationAdmin(DeploymentMode deploymentMode) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** @return {@code true} when the login of the request passes the rule */
	public boolean check(Authentication authentication) {
		throw new UnsupportedOperationException("not implemented yet");
	}

}

package io.opencelium.core.authz;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import io.opencelium.core.config.DeploymentMode;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Only an admin of a self-host installation passes the rule for the settings of the installation; in the cloud mode
 * nobody passes it, also an admin of a tenant.
 */
class InstallationAdminTest {

	private static final Authentication ADMIN = UsernamePasswordAuthenticationToken.authenticated("user-1", null,
			List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

	@Test
	void checkPassesWhenTheUserHasTheAdminRoleInTheSelfHostMode() {
		assertThat(new InstallationAdmin(DeploymentMode.SELF_HOST).check(ADMIN)).isTrue();
	}

	@Test
	void checkRefusesWhenTheUserHasNoAdminRole() {
		Authentication withoutRole = UsernamePasswordAuthenticationToken.authenticated("user-2", null, List.of());
		Authentication otherRole = UsernamePasswordAuthenticationToken.authenticated("user-3", null,
				List.of(new SimpleGrantedAuthority("ROLE_EDITOR")));
		var rule = new InstallationAdmin(DeploymentMode.SELF_HOST);

		assertThat(rule.check(withoutRole)).isFalse();
		assertThat(rule.check(otherRole)).isFalse();
		assertThat(rule.check(null)).isFalse();
	}

	@Test
	void checkRefusesWhenTheModeIsCloud() {
		assertThat(new InstallationAdmin(DeploymentMode.CLOUD).check(ADMIN)).isFalse();
	}

}

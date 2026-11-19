package io.opencelium.core.user;

import java.util.concurrent.TimeUnit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.tenant.TenantRunner;

/**
 * Every 5 minutes, and once right at startup: locks users whose generated password expired. It runs in the self-host
 * mode only, for the 1 tenant of the installation. In the cloud mode the Service Portal owns the users, and the
 * database of the configuration is the system database.
 */
@Component
class GeneratedPasswordLockJob {

	private final UserService users;

	private final TenantRunner tenants;

	private final DeploymentMode mode;

	GeneratedPasswordLockJob(UserService users, TenantRunner tenants, OpenCeliumProperties properties) {
		this.users = users;
		this.tenants = tenants;
		this.mode = properties.deploymentMode();
	}

	@Scheduled(fixedDelay = 5, timeUnit = TimeUnit.MINUTES)
	void lockExpiredGeneratedPasswords() {
		if (mode != DeploymentMode.SELF_HOST) {
			return;
		}
		tenants.run(TenantId.SELF_HOST, users::lockExpiredGeneratedPasswords);
	}

}

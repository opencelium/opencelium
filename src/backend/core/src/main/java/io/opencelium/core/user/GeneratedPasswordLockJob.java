package io.opencelium.core.user;

import java.util.concurrent.TimeUnit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.tenant.TenantRunner;

/** Every 5 minutes, and once right at startup: locks users whose generated password expired. */
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
		users.lockExpiredGeneratedPasswords();
	}

}

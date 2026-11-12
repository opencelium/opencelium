package io.opencelium.core.setup;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.user.UserService;

/**
 * The second half of the setup, after Spring starts: it makes the first admin of the self-host tenant, from the admin
 * marker of the wizard or, without a marker, as the default admin on a database without an OpenCelium user.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
class SetupCompletionRunner implements ApplicationRunner {

	private final AdminMarkerRepository markers;

	private final UserService users;

	private final DeploymentMode mode;

	SetupCompletionRunner(AdminMarkerRepository markers, UserService users, OpenCeliumProperties properties) {
		this.markers = markers;
		this.users = users;
		this.mode = properties.deploymentMode();
	}

	/** Does nothing until the implementation commit; a throwing body would stop each application context. */
	@Override
	public void run(ApplicationArguments args) {
	}

}

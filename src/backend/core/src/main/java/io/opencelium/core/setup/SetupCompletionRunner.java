package io.opencelium.core.setup;

import java.util.Optional;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.user.CreateAdminCommand;
import io.opencelium.core.user.UserService;

/**
 * The second half of the setup, after Spring starts on the written files: it finds the admin marker of the wizard,
 * makes the admin with the fixed first admin password and no forced change, and sets the setup state
 * {@code REQUIRED}. It runs in each process that starts the application, so a service in another process makes the
 * admin too. A start that fails before this runner keeps the marker, and the next start makes the admin. When the
 * admin exists and the marker is still there, a start stopped between the 2 writes, and only the state is set. It
 * runs last, after every other runner. The password goes to the user service only; nothing here logs it, and the
 * wizard process prints the login box. In the cloud mode no wizard runs, and the database of the configuration is the
 * system database, so the runner does nothing there.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
class SetupCompletionRunner implements ApplicationRunner {

	/** The wizard installs the self-host mode only, with its 1 tenant. */
	private static final TenantId TENANT = TenantId.SELF_HOST;

	private static final Log log = LogFactory.getLog(SetupCompletionRunner.class);

	private final SetupStateRepository states;

	private final UserService users;

	private final DeploymentMode mode;

	SetupCompletionRunner(SetupStateRepository states, UserService users, OpenCeliumProperties properties) {
		this.states = states;
		this.users = users;
		this.mode = properties.deploymentMode();
	}

	/**
	 * @throws IllegalStateException when the marker has no admin username, which the wizard always writes; the start
	 *                               stops and names the document
	 */
	@Override
	public void run(ApplicationArguments args) {
		if (mode != DeploymentMode.SELF_HOST) {
			return;
		}
		Optional<SetupStateDocument> marker = states.findById(TENANT.value())
				.filter(state -> state.state() == SetupState.PENDING_ADMIN);
		if (marker.isEmpty()) {
			return;
		}
		String username = marker.get().adminUsername();
		if (!users.adminExists(TENANT)) {
			if (username == null || username.isBlank()) {
				throw new IllegalStateException("The setup state '" + TENANT + "' in the collection "
						+ SetupStateDocument.COLLECTION + " is " + SetupState.PENDING_ADMIN + " but has no "
						+ SetupStateDocument.ADMIN_USERNAME + ". Set " + SetupStateDocument.ADMIN_USERNAME
						+ " in that document, or run the setup again.");
			}
			users.createAdmin(new CreateAdminCommand(TENANT, username,
					SetupContext.FIRST_ADMIN_PASSWORD.toCharArray(), false, false));
			log.info("Made the admin '" + username + "' from the admin marker of the setup");
		}
		states.requireAfterAdmin(TENANT.value());
		log.info("Setup state " + SetupState.REQUIRED + ": the admin completes the setup in the browser at /setup");
	}

}

package io.opencelium.core.setup;

import java.util.Optional;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Component;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.user.AdminAlreadyExistsException;
import io.opencelium.core.user.CreateAdminCommand;
import io.opencelium.core.user.UserService;

/**
 * The second half of the setup, after Spring starts: it makes the first admin of the self-host tenant with the fixed
 * first admin password and no forced change.
 * <ul>
 * <li>With the admin marker of the wizard, it makes the admin that the marker names, then deletes the marker. The
 * delete comes last, so a start that stops before the admin exists keeps the marker, and the next start makes the
 * admin; a start that stops between the 2 writes leaves the admin and the marker, and the next start only deletes the
 * marker.</li>
 * <li>Without a marker, it makes the default admin when the tenant has no user at all. A start without the wizard,
 * for example in a container without a terminal, then still has an admin. A tenant with users and no admin gets none,
 * so a deleted admin does not come back with the fixed password; the admin step of the setup makes one.</li>
 * </ul>
 * It runs in each process that starts the application, so 2 processes can race for the same admin: the user service
 * refuses the second one, and the start continues when the admin exists. A refusal without an admin means that the
 * username belongs to a user that is not an admin; then the start stops and keeps the marker. It runs last, after
 * every other runner. The password goes to the user service only; nothing here logs it, and the wizard process prints
 * the login box. In the cloud mode the Service Portal owns the users and the database of the configuration is the
 * system database, so the runner does nothing there.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
class SetupCompletionRunner implements ApplicationRunner {

	/** The wizard installs the self-host mode only, with its 1 tenant. */
	private static final TenantId TENANT = TenantId.SELF_HOST;

	private static final Log log = LogFactory.getLog(SetupCompletionRunner.class);

	private final AdminMarkerRepository markers;

	private final UserService users;

	private final DeploymentMode mode;

	SetupCompletionRunner(AdminMarkerRepository markers, UserService users, OpenCeliumProperties properties) {
		this.markers = markers;
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
		Optional<AdminMarkerDocument> marker = markers.findById(TENANT.value());
		if (marker.isPresent()) {
			makeAdminFromMarker(marker.get().adminUsername());
		}
		else if (!users.anyUserExists(TENANT)) {
			makeDefaultAdmin();
		}
	}

	private void makeAdminFromMarker(String username) {
		if (!users.adminExists(TENANT)) {
			if (username == null || username.isBlank()) {
				throw new IllegalStateException("The admin marker '" + TENANT + "' in the collection "
						+ AdminMarkerDocument.COLLECTION + " has no " + AdminMarkerDocument.ADMIN_USERNAME + ". Set "
						+ AdminMarkerDocument.ADMIN_USERNAME + " in that document, or run the setup again.");
			}
			if (createAdmin(username)) {
				log.info("Made the admin '" + username + "' from the admin marker of the setup");
			}
		}
		markers.deleteById(TENANT.value());
	}

	private void makeDefaultAdmin() {
		String username = SetupContext.DEFAULT_ADMIN_USERNAME;
		if (createAdmin(username)) {
			// A warning, so that a log filter keeps it: the admin password is public until the admin changes it.
			log.warn("Made the default admin '" + username + "' with the first admin password of the documentation;"
					+ " log in at " + SetupContext.LOGIN_PAGE + " and change it");
		}
	}

	/**
	 * @return false when another process that starts the application made the admin first
	 * @throws IllegalStateException when the username belongs to a user that is not an admin
	 */
	private boolean createAdmin(String username) {
		try {
			users.createAdmin(new CreateAdminCommand(TENANT, username,
					SetupContext.FIRST_ADMIN_PASSWORD.toCharArray(), false, false));
			return true;
		}
		catch (AdminAlreadyExistsException | DuplicateKeyException ex) {
			if (!users.adminExists(TENANT)) {
				throw new IllegalStateException("Cannot make the admin '" + username + "': a user of the tenant '"
						+ TENANT + "' that is not an admin has this username. Run the setup again with another admin"
						+ " username.", ex);
			}
			log.info("The admin exists: another process that starts the application made it");
			return false;
		}
	}

}

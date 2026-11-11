package io.opencelium.core.setup;

import java.util.List;
import java.util.Optional;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.files.PlannedFile;

/**
 * The handover from the wizard to the application: after the files are written, this action stores the setup state
 * {@code PENDING_ADMIN} with the admin username in the database. Each process that starts the application finds it
 * and makes the admin, also a service that starts in another process, and also the start after a failed one. The
 * marker holds no secret.
 */
public final class AdminMarker implements PlannedAction {

	/**
	 * @param connection    the database that the MongoDB step chose
	 * @param adminUsername the username of the admin that the start makes
	 */
	public AdminMarker(MongoConnection connection, String adminUsername) {
	}

	@Override
	public String description() {
		throw new UnsupportedOperationException();
	}

	@Override
	public List<PlannedFile> files() {
		throw new UnsupportedOperationException();
	}

	@Override
	public void run() {
		throw new UnsupportedOperationException();
	}

	@Override
	public Optional<String> undo() {
		throw new UnsupportedOperationException();
	}

}

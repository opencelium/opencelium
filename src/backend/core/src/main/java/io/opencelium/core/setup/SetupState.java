package io.opencelium.core.setup;

/** Where the setup of a tenant stands. */
public enum SetupState {

	/** The wizard wrote the admin marker; the next start of the application makes the admin. */
	PENDING_ADMIN,

	/** The admin exists, and the setup in the browser is not complete. */
	REQUIRED,

	/** The setup is complete. */
	COMPLETE

}

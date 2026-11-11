package io.opencelium.core.user;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.mongo.MongoConnection;

/**
 * Whether a database holds an admin of a tenant, read with the plain driver and a client of its own: the setup wizard
 * asks this before Spring starts, so it has no repository. A tenant with an admin gets no second one from the setup.
 */
public final class AdminLookup {

	private AdminLookup() {
	}

	/**
	 * @throws com.mongodb.MongoException when the server does not answer within the timeout of the startup ping, or
	 *                                    refuses the read
	 */
	public static boolean exists(MongoConnection connection, TenantId tenant) {
		throw new UnsupportedOperationException();
	}

}

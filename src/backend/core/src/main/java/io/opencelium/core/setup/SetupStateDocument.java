package io.opencelium.core.setup;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * The setup state of 1 tenant: data that the application owns, like a user record, not a configuration value. The
 * tenant ID is the document ID, so a tenant has 1 document from the first write on, also when the wizard writes it
 * with the plain driver before Spring makes any index.
 *
 * @param adminUsername the admin that the next start makes; set only while the state is
 *                      {@link SetupState#PENDING_ADMIN}
 */
@Document(SetupStateDocument.COLLECTION)
public record SetupStateDocument(@Id String tenantId, SetupState state, String adminUsername) {

	/** The collection; {@link AdminMarker} writes it with the plain driver, by these field names. */
	public static final String COLLECTION = "setup_state";

	static final String ID = "_id";

	static final String STATE = "state";

	static final String ADMIN_USERNAME = "adminUsername";

}

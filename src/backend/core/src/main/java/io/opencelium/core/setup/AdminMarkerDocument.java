package io.opencelium.core.setup;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * The admin marker of 1 tenant: the admin username that the wizard asked, kept in the database until the first start
 * makes that admin. It is data that the application owns for 1 start, not a configuration value, and it holds no
 * secret. The tenant ID is the document ID, so a tenant has at most 1 marker, also when the wizard writes it with the
 * plain driver before Spring makes any index.
 *
 * @param adminUsername the admin that the next start makes
 */
@Document(AdminMarkerDocument.COLLECTION)
public record AdminMarkerDocument(@Id String tenantId, String adminUsername) {

	/** The collection; {@link AdminMarker} writes it with the plain driver, by these field names. */
	public static final String COLLECTION = "admin_marker";

	static final String ID = "_id";

	static final String ADMIN_USERNAME = "adminUsername";

}

package io.opencelium.core.settings;

import java.util.Optional;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * The database values of the installation settings: 1 document with a field for each value that is different from
 * its default, under the path of its setting key. The settings of the installation belong to no tenant, so the
 * document is in the database that the yml file names and not behind the tenant-document access. A new installation
 * has no document.
 */
final class SettingsRepository {

	static final String COLLECTION = "settings";

	static final String INSTALLATION_ID = "installation";

	private final MongoTemplate mongo;

	/** @param mongo the template of the database that the yml file names */
	SettingsRepository(MongoTemplate mongo) {
		this.mongo = mongo;
	}

	/** The document of the installation settings, or empty when no setting has a database value. */
	Optional<Document> installationValues() {
		return Optional.ofNullable(mongo.findById(INSTALLATION_ID, Document.class, COLLECTION));
	}

}

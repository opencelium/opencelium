package io.opencelium.core.settings;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

import org.bson.Document;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

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

	/**
	 * Changes the document in 1 update, so a change applies all its values or none. A setting key is the path of its
	 * field: {@code broker.port} is the field {@code port} of the subdocument {@code broker}.
	 *
	 * @param values the setting keys and their new database values
	 * @param resets the setting keys whose database value the update removes
	 * @return the document as it was before the update, or empty when there was none or nothing changed
	 */
	Optional<Document> change(Map<String, Object> values, Collection<String> resets) {
		if (values.isEmpty() && resets.isEmpty()) {
			return Optional.empty();
		}
		Update update = new Update();
		values.forEach(update::set);
		resets.forEach(update::unset);
		Query installation = Query.query(Criteria.where("_id").is(INSTALLATION_ID));
		FindAndModifyOptions before = FindAndModifyOptions.options().returnNew(false).upsert(!values.isEmpty());
		return Optional.ofNullable(mongo.findAndModify(installation, update, before, Document.class, COLLECTION));
	}

}

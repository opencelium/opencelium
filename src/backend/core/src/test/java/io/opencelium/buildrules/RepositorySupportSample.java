package io.opencelium.buildrules;

import java.util.List;

import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.repository.query.MongoEntityInformation;
import org.springframework.data.mongodb.repository.support.SimpleMongoRepository;

/** Breaks the rule for the tenant documents: a read through the repository support of Spring Data and the template. */
class RepositorySupportSample {

	List<PasswordHashDocument> all(MongoOperations mongo, MongoEntityInformation<PasswordHashDocument, String> type) {
		return new SimpleMongoRepository<>(type, mongo).findAll();
	}

}

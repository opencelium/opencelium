package io.opencelium.buildrules;

import java.util.List;

import org.springframework.data.mongodb.core.MongoOperations;

/** Breaks the rule for the tenant documents: a write through a method reference to the Mongo template. */
class MethodReferenceSample {

	void saveEach(MongoOperations mongo, List<PasswordHashDocument> documents) {
		documents.forEach(mongo::save);
	}

}

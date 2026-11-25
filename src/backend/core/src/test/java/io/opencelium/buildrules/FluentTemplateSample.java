package io.opencelium.buildrules;

import java.util.List;

import org.bson.Document;
import org.springframework.data.mongodb.core.FluentMongoOperations;

/**
 * Breaks the rule for the tenant documents: a read of a collection through the fluent operations, a supertype of the
 * Mongo template.
 */
class FluentTemplateSample {

	List<Document> users(FluentMongoOperations mongo) {
		return mongo.query(Document.class).inCollection("users").all();
	}

}

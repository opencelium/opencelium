package io.opencelium.buildrules;

import java.util.List;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

/** Breaks the rule for the tenant documents: a read of a collection through the Mongo template. */
class TemplateReadSample {

	List<Document> users(MongoTemplate mongo) {
		return mongo.findAll(Document.class, "users");
	}

}

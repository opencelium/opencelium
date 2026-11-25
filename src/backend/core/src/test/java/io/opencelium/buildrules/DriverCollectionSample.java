package io.opencelium.buildrules;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

/** Breaks the rule for the tenant documents: a read of a collection through the MongoDB driver. */
class DriverCollectionSample {

	Document firstUser(MongoCollection<Document> users) {
		return users.find().first();
	}

}

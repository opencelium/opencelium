package io.opencelium.buildrules;

import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.changestream.ChangeStreamDocument;
import org.bson.Document;

/**
 * Breaks the rule for the tenant documents: a read of the changes of each collection, through the database of the
 * MongoDB driver.
 */
class ChangeStreamSample {

	ChangeStreamDocument<Document> firstChange(MongoDatabase database) {
		return database.watch().first();
	}

}

package io.opencelium.buildrules;

import org.bson.Document;
import org.springframework.data.mongodb.core.BulkOperations;

/** Breaks the rule for the tenant documents: a write through the bulk operations of the Mongo template. */
class BulkOperationsSample {

	void insertUser(BulkOperations users) {
		users.insert(new Document()).execute();
	}

}

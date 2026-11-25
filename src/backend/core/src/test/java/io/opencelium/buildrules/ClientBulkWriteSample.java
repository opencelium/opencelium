package io.opencelium.buildrules;

import java.util.List;

import com.mongodb.MongoNamespace;
import com.mongodb.client.MongoClient;
import com.mongodb.client.model.bulk.ClientNamespacedWriteModel;
import org.bson.Document;

/** Breaks the rule for the tenant documents: a write into a collection through the client of the MongoDB driver. */
class ClientBulkWriteSample {

	void insertUser(MongoClient client) {
		client.bulkWrite(
				List.of(ClientNamespacedWriteModel.insertOne(new MongoNamespace("opencelium.users"), new Document())));
	}

}

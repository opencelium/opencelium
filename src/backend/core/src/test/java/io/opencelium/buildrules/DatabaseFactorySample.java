package io.opencelium.buildrules;

import com.mongodb.client.gridfs.GridFSBuckets;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.springframework.data.mongodb.MongoDatabaseFactory;

/**
 * Breaks the rule for the tenant documents: a read of the files of a database that the database factory of Spring Data
 * opens by its name.
 */
class DatabaseFactorySample {

	GridFSFile firstFile(MongoDatabaseFactory databases) {
		return GridFSBuckets.create(databases.getMongoDatabase("other")).find().first();
	}

}

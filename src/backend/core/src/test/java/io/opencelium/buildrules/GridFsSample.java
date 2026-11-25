package io.opencelium.buildrules;

import com.mongodb.client.gridfs.model.GridFSFile;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;

/** Breaks the rule for the tenant documents: a read of the files of a database through GridFS of Spring Data. */
class GridFsSample {

	GridFSFile firstFile(MongoDatabaseFactory database, MongoConverter converter) {
		return new GridFsTemplate(database, converter).find(new Query()).first();
	}

}

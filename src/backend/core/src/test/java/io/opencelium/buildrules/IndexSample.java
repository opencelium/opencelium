package io.opencelium.buildrules;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

/** Keeps the rule for the tenant documents: an index operation makes an index and reads and writes no document. */
class IndexSample {

	String tenantIndex(MongoTemplate mongo) {
		return mongo.indexOps("users").createIndex(new Index().on("tenantId", Sort.Direction.ASC));
	}

}

package io.opencelium.buildrules;

import java.util.List;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexInfo;

/** Keeps the rule for the tenant documents: an index operation reads and writes no document. */
class IndexSample {

	List<IndexInfo> indexes(MongoTemplate mongo) {
		return mongo.indexOps("users").getIndexInfo();
	}

}

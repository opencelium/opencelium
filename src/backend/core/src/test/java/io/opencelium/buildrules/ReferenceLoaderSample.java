package io.opencelium.buildrules;

import org.bson.Document;
import org.springframework.data.mongodb.core.convert.ReferenceLoader;
import org.springframework.data.mongodb.core.convert.ReferenceLoader.DocumentReferenceQuery;
import org.springframework.data.mongodb.core.convert.ReferenceResolver.ReferenceCollection;

/** Breaks the rule for the tenant documents: a read of referenced documents through a loader of Spring Data. */
class ReferenceLoaderSample {

	Iterable<Document> referenced(ReferenceLoader loader, DocumentReferenceQuery query, ReferenceCollection users) {
		return loader.fetchMany(query, users);
	}

}

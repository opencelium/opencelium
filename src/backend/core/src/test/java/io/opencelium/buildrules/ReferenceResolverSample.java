package io.opencelium.buildrules;

import com.mongodb.DBRef;
import org.bson.Document;
import org.springframework.data.mongodb.core.convert.DbRefResolver;

/** Breaks the rule for the tenant documents: a read of a referenced document through a resolver of Spring Data. */
class ReferenceResolverSample {

	Document referenced(DbRefResolver resolver, DBRef reference) {
		return resolver.fetch(reference);
	}

}

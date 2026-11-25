package io.opencelium.buildrules;

import java.util.List;

import org.bson.Document;
import org.springframework.data.mongodb.core.ExecutableFindOperation.TerminatingFind;

/** Breaks the rule for the tenant documents: a read through a fluent query of the template that another class gives. */
class FluentQuerySample {

	List<Document> users(TerminatingFind<Document> query) {
		return query.all();
	}

}

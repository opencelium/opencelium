package io.opencelium.core.auth;

import java.time.Duration;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

/**
 * Creates the index of the sessions collection at startup; Spring Data's automatic index creation is off. A TTL index
 * on the end of a session removes the record after the end. MongoDB runs the removal approximately each 60 seconds,
 * so the session service compares the end with the clock of core too.
 */
@Component
class SessionIndexes implements InitializingBean {

	private static final String ENDS_AT_TTL = "endsAt_ttl";

	private final MongoTemplate mongo;

	SessionIndexes(MongoTemplate mongo) {
		this.mongo = mongo;
	}

	@Override
	public void afterPropertiesSet() {
		mongo.indexOps(SessionRecord.class).createIndex(new Index().on(SessionRecord.ENDS_AT, Sort.Direction.ASC)
				.expire(Duration.ZERO).named(ENDS_AT_TTL));
	}

}

package io.opencelium.core.auth;

import java.time.Duration;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

/**
 * Creates the index of the login records at startup; Spring Data's automatic index creation is off. A TTL index on the
 * end of a login removes the record of a login that the person does not complete. MongoDB runs the removal
 * approximately each 60 seconds, so a record can stay up to about 1 minute after its end.
 */
@Component
class OidcLoginIndexes implements InitializingBean {

	private static final String EXPIRES_AT_TTL = "expiresAt_ttl";

	private final MongoTemplate mongo;

	OidcLoginIndexes(MongoTemplate mongo) {
		this.mongo = mongo;
	}

	@Override
	public void afterPropertiesSet() {
		mongo.indexOps(OidcLoginRecord.class).createIndex(new Index().on(OidcLoginRecord.EXPIRES_AT,
				Sort.Direction.ASC).expire(Duration.ZERO).named(EXPIRES_AT_TTL));
	}

}

package io.opencelium.core.user;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

/** Creates the indexes of the users collection at startup; Spring Data's automatic index creation is off. */
@Component
class UserIndexes implements InitializingBean {

	static final String TENANT_USERNAME = "tenantId_username_unique";

	private final MongoTemplate mongo;

	UserIndexes(MongoTemplate mongo) {
		this.mongo = mongo;
	}

	@Override
	public void afterPropertiesSet() {
		mongo.indexOps(UserDocument.class).createIndex(new Index().on("tenantId", Sort.Direction.ASC)
				.on("username", Sort.Direction.ASC).unique().named(TENANT_USERNAME));
	}

}

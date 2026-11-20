package io.opencelium.core.user;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.PartialIndexFilter;
import org.springframework.data.mongodb.core.schema.JsonSchemaObject;
import org.springframework.stereotype.Component;

import io.opencelium.core.tenant.TenantDocument;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * Creates the indexes of the users collection at startup; Spring Data's automatic index creation is off. A username
 * and an email are each unique in a tenant. The email is optional: only a user with an email is in its index, so that
 * many users of a tenant can have none.
 */
@Component
class UserIndexes implements InitializingBean {

	static final String TENANT_USERNAME = "tenantId_username_unique";

	static final String TENANT_EMAIL = "tenantId_email_unique";

	private final MongoTemplate mongo;

	UserIndexes(MongoTemplate mongo) {
		this.mongo = mongo;
	}

	@Override
	public void afterPropertiesSet() {
		mongo.indexOps(UserDocument.class).createIndex(new Index().on("tenantId", Sort.Direction.ASC)
				.on("username", Sort.Direction.ASC).unique().named(TENANT_USERNAME));
		mongo.indexOps(UserDocument.class)
				.createIndex(new Index().on(TenantDocument.TENANT_ID, Sort.Direction.ASC)
						.on(UserDocument.EMAIL, Sort.Direction.ASC).unique().named(TENANT_EMAIL)
						.partial(PartialIndexFilter.of(where(UserDocument.EMAIL).type(JsonSchemaObject.Type.STRING))));
	}

}

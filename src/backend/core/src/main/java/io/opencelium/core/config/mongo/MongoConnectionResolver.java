package io.opencelium.core.config.mongo;

import io.opencelium.common.tenant.TenantId;

/**
 * Finds the database of a tenant. The seam for decision #11: today {@link StaticMongoConnectionResolver} knows only
 * the database from application.yml; per-tenant routing through the tenant catalog replaces it later.
 */
public interface MongoConnectionResolver {

	MongoConnection resolve(TenantId tenant);

}

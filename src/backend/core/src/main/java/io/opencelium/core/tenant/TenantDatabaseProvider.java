package io.opencelium.core.tenant;

import com.mongodb.client.MongoDatabase;
import io.opencelium.common.tenant.TenantId;

public interface TenantDatabaseProvider {

    /**
     * @return the database holding this client's data, ready to use
     * @throws RuntimeException when the client is unknown, or their database cannot be reached —
     *                          failures stay scoped to the client whose request triggered them
     */
    MongoDatabase databaseFor(TenantId tenant);
}

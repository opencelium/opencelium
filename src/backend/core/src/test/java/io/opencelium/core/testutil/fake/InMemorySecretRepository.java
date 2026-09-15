package io.opencelium.core.testutil.fake;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.secret.SecretDocument;
import io.opencelium.core.config.secret.SecretRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * In-memory {@link SecretRepository}, so encryption and tenant scoping can be tested without a
 * database. It matches on tenant and id together, exactly like the MongoDB implementation.
 */
public class InMemorySecretRepository implements SecretRepository {

    private final Map<String, SecretDocument> documents = new HashMap<>();

    @Override
    public void insert(TenantId tenant, SecretDocument document) {
        documents.put(key(tenant, document.id()), document);
    }

    @Override
    public Optional<SecretDocument> find(TenantId tenant, String id) {
        return Optional.ofNullable(documents.get(key(tenant, id)));
    }

    @Override
    public void delete(TenantId tenant, String id) {
        documents.remove(key(tenant, id));
    }

    /** Replaces a stored document, standing in for someone editing the collection by hand. */
    public void replace(TenantId tenant, SecretDocument document) {
        documents.put(key(tenant, document.id()), document);
    }

    public SecretDocument get(TenantId tenant, String id) {
        return documents.get(key(tenant, id));
    }

    public int size() {
        return documents.size();
    }

    private static String key(TenantId tenant, String id) {
        return tenant.value() + ':' + id;
    }
}

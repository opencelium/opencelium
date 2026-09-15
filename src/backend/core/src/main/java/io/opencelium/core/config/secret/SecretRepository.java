package io.opencelium.core.config.secret;

import io.opencelium.common.tenant.TenantId;

import java.util.Optional;

public interface SecretRepository {

    void insert(TenantId tenant, SecretDocument document);

    Optional<SecretDocument> find(TenantId tenant, String id);

    void delete(TenantId tenant, String id);
}

package io.opencelium.core.config.secret;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.TenantDatabaseProvider;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.Binary;

import java.util.Date;
import java.util.Optional;

public class MongoSecretRepository implements SecretRepository {

    private final TenantDatabaseProvider databases;

    public MongoSecretRepository(TenantDatabaseProvider databases) {
        this.databases = databases;
    }

    @Override
    public void insert(TenantId tenant, SecretDocument document) {
        secrets(tenant).insertOne(toBson(document));
    }

    @Override
    public Optional<SecretDocument> find(TenantId tenant, String id) {
        Document found = secrets(tenant).find(byTenantAndId(tenant, id)).first();
        return Optional.ofNullable(found).map(MongoSecretRepository::fromBson);
    }

    @Override
    public void delete(TenantId tenant, String id) {
        secrets(tenant).deleteOne(byTenantAndId(tenant, id));
    }

    private MongoCollection<Document> secrets(TenantId tenant) {
        return databases.databaseFor(tenant).getCollection(SecretDocument.COLLECTION);
    }

    private static Bson byTenantAndId(TenantId tenant, String id) {
        return Filters.and(Filters.eq("_id", id), Filters.eq("tenantId", tenant.value()));
    }

    private static Document toBson(SecretDocument document) {
        return new Document("_id", document.id())
                .append("tenantId", document.tenantId())
                .append("alg", document.alg())
                .append("keyId", document.keyId())
                .append("iv", new Binary(document.iv()))
                .append("ciphertext", new Binary(document.ciphertext()))
                .append("createdAt", Date.from(document.createdAt()));
    }

    private static SecretDocument fromBson(Document bson) {
        return new SecretDocument(
                bson.getString("_id"),
                bson.getString("tenantId"),
                bson.getString("alg"),
                bson.getString("keyId"),
                bson.get("iv", Binary.class).getData(),
                bson.get("ciphertext", Binary.class).getData(),
                bson.getDate("createdAt").toInstant());
    }
}

package io.opencelium.core.secrets;

import java.time.Clock;
import java.util.UUID;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.secrets.keys.DekAccess;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The secret provider of core: each secret is 1 document of the {@code secrets} collection, encrypted with the DEK of
 * its owner. The secrets of the installation, with the owner {@code system}, are in the database that the yml file
 * names and use the system DEK. Another owner, or an owner without a DEK, stops the operation.
 */
final class MongoSecretStorage implements SecretProvider {

	private static final String TENANT_ID = "tenantId";

	private final MongoTemplate mongo;

	private final DekAccess dekAccess;

	private final SecretCipher cipher;

	private final Clock clock;

	/** @param mongo the template of the database that the yml file names */
	MongoSecretStorage(MongoTemplate mongo, DekAccess dekAccess, SecretCipher cipher, Clock clock) {
		this.mongo = mongo;
		this.dekAccess = dekAccess;
		this.cipher = cipher;
		this.clock = clock;
	}

	@Override
	public SecretReference store(TenantId owner, byte[] plaintext) {
		String id = UUID.randomUUID().toString();
		SecretDocument document = dekAccess.use(owner,
				(dekVersion, dek) -> cipher.encrypt(dek, owner, id, dekVersion, plaintext, clock.instant()));
		mongo.insert(document);
		return new SecretReference(owner, id);
	}

	/** @throws IllegalStateException when the reference names no secret of its owner */
	@Override
	public byte[] read(SecretReference reference) {
		SecretDocument document = mongo.findOne(of(reference), SecretDocument.class);
		if (document == null) {
			throw new IllegalStateException("The secret " + reference + " does not exist.");
		}
		return dekAccess.use(reference.owner(), document.dekVersion(), (dekVersion, dek) -> cipher.decrypt(dek, document));
	}

	@Override
	public void delete(SecretReference reference) {
		mongo.remove(of(reference), SecretDocument.class);
	}

	private static Query of(SecretReference reference) {
		return Query.query(where("_id").is(reference.id()).and(TENANT_ID).is(reference.owner().value()));
	}

}

package io.opencelium.core.secrets;

import java.time.Clock;

import org.springframework.data.mongodb.core.MongoTemplate;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.secrets.keys.DekAccess;

/**
 * The secret provider of core: each secret is 1 document of the {@code secrets} collection, encrypted with the DEK of
 * its owner. The secrets of the installation, with the owner {@code system}, are in the database that the yml file
 * names and use the system DEK.
 */
final class MongoSecretStorage implements SecretProvider {

	/** @param mongo the template of the database that the yml file names */
	MongoSecretStorage(MongoTemplate mongo, DekAccess dekAccess, SecretCipher cipher, Clock clock) {
	}

	@Override
	public SecretReference store(TenantId owner, byte[] plaintext) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	@Override
	public byte[] read(SecretReference reference) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	@Override
	public void delete(SecretReference reference) {
		throw new UnsupportedOperationException("not implemented yet");
	}

}

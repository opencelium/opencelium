package io.opencelium.core.secrets.keys;

import org.springframework.data.mongodb.core.MongoTemplate;

import io.opencelium.common.tenant.TenantId;

/**
 * Gives the data key (DEK) of an owner for 1 operation: it reads the wrapped DEK from the {@code keys} collection of
 * the database that the yml file names, unwraps it with the root key, runs the operation, and zeroes the DEK. No
 * caller keeps a DEK.
 */
public final class DekAccess {

	DekAccess(MongoTemplate mongo, DekWrapper wrapper, RootKey rootKey) {
	}

	/**
	 * Runs the operation with the newest DEK of the owner.
	 *
	 * @throws IllegalStateException when the owner has no DEK
	 */
	public <T> T use(TenantId owner, DekUse<T> operation) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/**
	 * Runs the operation with the DEK of the owner in the given version.
	 *
	 * @throws IllegalStateException when the owner has no DEK in that version
	 */
	public <T> T use(TenantId owner, int version, DekUse<T> operation) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** An operation with a DEK. The DEK is zeroed after the operation: the operation does not keep it. */
	@FunctionalInterface
	public interface DekUse<T> {

		/**
		 * @param version the version of the DEK
		 * @param dek     the 32 bytes of the DEK
		 */
		T apply(int version, byte[] dek);

	}

}

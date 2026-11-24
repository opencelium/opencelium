package io.opencelium.core.secrets.keys;

import java.util.Arrays;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import io.opencelium.common.tenant.TenantId;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * Gives the data key (DEK) of an owner for 1 operation: it reads the wrapped DEK from the {@code keys} collection of
 * the database that the yml file names, unwraps it with the root key, runs the operation, and zeroes the DEK, also
 * when the operation fails. No caller keeps a DEK.
 * <p>
 * The only owner is the installation, the reserved tenant {@code system}: the DEK of a tenant belongs to the database
 * of that tenant and its tenant-document access, which this class does not use. Another owner stops the operation.
 */
public final class DekAccess {

	private static final String TENANT_ID = "tenantId";

	private static final String DEK_VERSION = "dekVersion";

	private final MongoTemplate mongo;

	private final DekWrapper wrapper;

	private final RootKey rootKey;

	/** @param mongo the template of the database that the yml file names */
	DekAccess(MongoTemplate mongo, DekWrapper wrapper, RootKey rootKey) {
		this.mongo = mongo;
		this.wrapper = wrapper;
		this.rootKey = rootKey;
	}

	/**
	 * Runs the operation with the newest DEK of the owner.
	 *
	 * @throws IllegalStateException when the owner is not the installation, or has no DEK
	 */
	public <T> T use(TenantId owner, DekUse<T> operation) {
		requireInstallation(owner);
		WrappedDek wrapped = newestWrapped(owner);
		if (wrapped == null) {
			throw new IllegalStateException("No data key exists for the owner " + owner.value() + ".");
		}
		return use(wrapped, operation);
	}

	/**
	 * Runs the operation with the DEK of the owner in the given version.
	 *
	 * @throws IllegalStateException when the owner is not the installation, or has no DEK in that version
	 */
	public <T> T use(TenantId owner, int version, DekUse<T> operation) {
		requireInstallation(owner);
		WrappedDek wrapped = mongo.findOne(
				Query.query(where(TENANT_ID).is(owner.value()).and(DEK_VERSION).is(version)), WrappedDek.class);
		if (wrapped == null) {
			throw new IllegalStateException(
					"No data key of version " + version + " exists for the owner " + owner.value() + ".");
		}
		return use(wrapped, operation);
	}

	/** The newest wrapped DEK of the owner, or {@code null} when the owner has none. */
	WrappedDek newestWrapped(TenantId owner) {
		return mongo.findOne(Query.query(where(TENANT_ID).is(owner.value()))
			.with(Sort.by(Sort.Direction.DESC, DEK_VERSION))
			.limit(1), WrappedDek.class);
	}

	private static void requireInstallation(TenantId owner) {
		if (!TenantId.SYSTEM.equals(owner)) {
			throw new IllegalStateException("No data key of the owner " + owner.value()
					+ " is available here: only the data key of the installation is.");
		}
	}

	private <T> T use(WrappedDek wrapped, DekUse<T> operation) {
		byte[] dek = wrapper.unwrap(rootKey, wrapped);
		try {
			return operation.apply(wrapped.dekVersion(), dek);
		}
		finally {
			Arrays.fill(dek, (byte) 0);
		}
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

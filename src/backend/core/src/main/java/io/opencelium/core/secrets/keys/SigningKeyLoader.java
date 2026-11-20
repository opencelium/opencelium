package io.opencelium.core.secrets.keys;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.Arrays;
import java.util.function.Supplier;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Query;

import io.opencelium.common.tenant.TenantId;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * Puts the signing key of the installation into memory at the start, after the key canary. On a new installation it
 * generates the system data key and the signing key and stores them in the database that the yml file names; at each
 * later start, and in each other core instance, it reads the same keys. Unique indexes accept 1 document for each
 * version, so when 2 core instances start on an empty database at the same time, the one whose insert fails reads the
 * stored document.
 */
final class SigningKeyLoader implements SmartInitializingSingleton, AutoCloseable {

	static final int INITIAL_VERSION = 1;

	static final String SYSTEM_DEK_INDEX = "tenantId_dekVersion_unique";

	static final String SIGNING_KEY_INDEX = "version_unique";

	private static final String TENANT_ID = "tenantId";

	private static final String DEK_VERSION = "dekVersion";

	private static final Log log = LogFactory.getLog(SigningKeyLoader.class);

	private final MongoTemplate mongo;

	private final DekWrapper wrapper;

	private final SigningKeyCipher cipher;

	private final RootKey rootKey;

	private final KeyStartupCanary canary;

	private final Clock clock;

	private final SecureRandom random = new SecureRandom();

	private volatile SigningKey signingKey;

	/** @param mongo the template of the database that the yml file names */
	SigningKeyLoader(MongoTemplate mongo, DekWrapper wrapper, SigningKeyCipher cipher, RootKey rootKey,
			KeyStartupCanary canary, Clock clock) {
		this.mongo = mongo;
		this.wrapper = wrapper;
		this.cipher = cipher;
		this.rootKey = rootKey;
		this.canary = canary;
		this.clock = clock;
	}

	/** The canary first: a wrong root key must stop the start before it wraps a new system data key. */
	@Override
	public void afterSingletonsInstantiated() {
		canary.check();
		signingKey = load();
		log.info("Signing key loaded (version " + signingKey.version() + ")");
	}

	/**
	 * The signing key that the start loaded. The loader owns it and zeroes it when core stops: a caller never closes
	 * it.
	 */
	SigningKey signingKey() {
		SigningKey key = signingKey;
		if (key == null) {
			throw new IllegalStateException("The signing key is not loaded yet.");
		}
		return key;
	}

	/**
	 * Reads the system data key and the newest signing key, and generates and stores each one that does not exist.
	 *
	 * @return a new in-memory copy of the stored signing key; the caller closes it
	 * @throws KeyStartupException when a stored key does not decrypt or is damaged
	 */
	SigningKey load() {
		createIndexes();
		byte[] systemDek = unwrap(readOrInsert(this::storedSystemDek, this::newSystemDek));
		try {
			EncryptedSigningKey stored = readOrInsert(this::storedSigningKey, () -> newSigningKey(systemDek));
			return new SigningKey(stored.version(), decrypt(systemDek, stored));
		}
		finally {
			Arrays.fill(systemDek, (byte) 0);
		}
	}

	/** Zeroes the signing key when core stops. */
	@Override
	public void close() {
		SigningKey key = signingKey;
		if (key != null) {
			key.close();
		}
	}

	private void createIndexes() {
		mongo.indexOps(WrappedDek.class).createIndex(new Index().on(TENANT_ID, Sort.Direction.ASC)
				.on(DEK_VERSION, Sort.Direction.ASC).unique().named(SYSTEM_DEK_INDEX));
		mongo.indexOps(EncryptedSigningKey.class).createIndex(
				new Index().on(EncryptedSigningKey.VERSION, Sort.Direction.ASC).unique().named(SIGNING_KEY_INDEX));
	}

	/**
	 * The stored document; else the new one, after its insert. An insert that the unique index refuses means that
	 * another core instance stored its document first, so the stored one is read again.
	 */
	private static <T> T readOrInsert(Supplier<T> stored, Supplier<T> insertNew) {
		T found = stored.get();
		if (found != null) {
			return found;
		}
		try {
			return insertNew.get();
		}
		catch (DuplicateKeyException ex) {
			return stored.get();
		}
	}

	private WrappedDek storedSystemDek() {
		return mongo.findOne(Query.query(where(TENANT_ID).is(TenantId.SYSTEM.value()))
				.with(Sort.by(Sort.Direction.DESC, DEK_VERSION)).limit(1), WrappedDek.class);
	}

	private WrappedDek newSystemDek() {
		byte[] dek = randomKey();
		try {
			WrappedDek stored = mongo.insert(
					wrapper.wrap(rootKey, TenantId.SYSTEM, INITIAL_VERSION, dek, clock.instant()));
			log.info("Generated the system data key of this installation (version " + INITIAL_VERSION + ")");
			return stored;
		}
		finally {
			Arrays.fill(dek, (byte) 0);
		}
	}

	private EncryptedSigningKey storedSigningKey() {
		return mongo.findOne(new Query().with(Sort.by(Sort.Direction.DESC, EncryptedSigningKey.VERSION)).limit(1),
				EncryptedSigningKey.class);
	}

	private EncryptedSigningKey newSigningKey(byte[] systemDek) {
		byte[] key = randomKey();
		try {
			EncryptedSigningKey stored = mongo.insert(cipher.encrypt(systemDek, INITIAL_VERSION, key, clock.instant()));
			log.info("Generated the signing key of this installation (version " + INITIAL_VERSION + ")");
			return stored;
		}
		finally {
			Arrays.fill(key, (byte) 0);
		}
	}

	private byte[] unwrap(WrappedDek stored) {
		try {
			return wrapper.unwrap(rootKey, stored);
		}
		catch (WrongKeyException ex) {
			throw KeyStartupException.restoreOrReset("The master key from " + rootKey.source().description()
					+ " (key id " + rootKey.id() + ") cannot decrypt the stored data key of tenant '"
					+ stored.tenantId() + "'.");
		}
		catch (IllegalArgumentException ex) {
			throw KeyStartupException.damaged(ex.getMessage());
		}
	}

	/** Core generates no new signing key on its own: a new key would end each session without a message. */
	private byte[] decrypt(byte[] systemDek, EncryptedSigningKey stored) {
		try {
			return cipher.decrypt(systemDek, stored);
		}
		catch (WrongKeyException ex) {
			throw KeyStartupException.signingKey("The stored signing key (version " + stored.version()
					+ ") does not decrypt with the system data key of this installation: the document was changed,"
					+ " or another system data key encrypted it.");
		}
		catch (IllegalArgumentException ex) {
			throw KeyStartupException.signingKey(ex.getMessage());
		}
	}

	private byte[] randomKey() {
		byte[] key = new byte[SigningKey.LENGTH];
		random.nextBytes(key);
		return key;
	}

}

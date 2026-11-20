package io.opencelium.core.secrets.keys;

import java.util.Arrays;

import javax.crypto.spec.SecretKeySpec;

/**
 * The key that signs and checks the tokens of core: 32 random bytes for HMAC-SHA256, the same in each core instance
 * of an installation. Lives in memory only; {@link #close()} zeroes it. {@link #toString()} shows the version, never
 * the key.
 */
final class SigningKey implements AutoCloseable {

	/** Length in bytes: the output length of HMAC-SHA256. */
	static final int LENGTH = 32;

	private static final String ALGORITHM = "HmacSHA256";

	private final int version;

	private final byte[] material;

	private boolean closed;

	/** Takes ownership of {@code material}: the caller must not keep or reuse the array. */
	SigningKey(int version, byte[] material) {
		if (material.length != LENGTH) {
			throw new IllegalArgumentException("A signing key has " + LENGTH + " bytes, not " + material.length + ".");
		}
		this.version = version;
		this.material = material;
	}

	int version() {
		return version;
	}

	/**
	 * A new HMAC-SHA256 key spec for one signature or one check. Synchronized with {@link #close()}, so a check that
	 * runs while core stops never gets a key that is partly zeroes.
	 */
	synchronized SecretKeySpec secretKey() {
		if (closed) {
			throw new IllegalStateException(this + " is closed.");
		}
		return new SecretKeySpec(material, ALGORITHM);
	}

	@Override
	public synchronized void close() {
		closed = true;
		Arrays.fill(material, (byte) 0);
	}

	@Override
	public String toString() {
		return "SigningKey[version=" + version + "]";
	}

}

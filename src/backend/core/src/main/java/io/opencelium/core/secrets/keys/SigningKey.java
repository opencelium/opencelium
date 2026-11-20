package io.opencelium.core.secrets.keys;

import javax.crypto.spec.SecretKeySpec;

/**
 * The key that signs and checks the tokens of core: 32 random bytes for HMAC-SHA256, the same in each core instance
 * of an installation. Lives in memory only; {@link #close()} zeroes it. {@link #toString()} shows the version, never
 * the key.
 */
final class SigningKey implements AutoCloseable {

	/** Takes ownership of {@code material}: the caller must not keep or reuse the array. */
	SigningKey(int version, byte[] material) {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	/** A new HMAC-SHA256 key spec for one signature or one check. */
	SecretKeySpec secretKey() {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	@Override
	public void close() {
		throw new UnsupportedOperationException("Not implemented yet");
	}

}

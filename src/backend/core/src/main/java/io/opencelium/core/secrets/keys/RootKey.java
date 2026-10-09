package io.opencelium.core.secrets.keys;

import java.util.Arrays;
import java.util.Objects;

import javax.crypto.spec.SecretKeySpec;

/**
 * The root key of this installation (self-hosted name: master key): 32 bytes that wrap the per-tenant data keys and
 * nothing else. Lives in memory only; {@link #close()} zeroes it, which Spring does on shutdown.
 * {@link #toString()} shows the key id, never the key.
 */
public final class RootKey implements AutoCloseable {

	/** Length in bytes: AES-256. */
	public static final int LENGTH = 32;

	/** Id of an installation's first root key. Root-key rotation introduces further ids. */
	public static final String INITIAL_ID = "k-01";

	private final String id;

	private final RootKeySource source;

	private final byte[] material;

	private volatile boolean closed;

	/** Takes ownership of {@code material}: the caller must not keep or reuse the array. */
	RootKey(String id, RootKeySource source, byte[] material) {
		Objects.requireNonNull(id, "id");
		Objects.requireNonNull(source, "source");
		if (material.length != LENGTH) {
			throw new IllegalArgumentException("A root key has " + LENGTH + " bytes, not " + material.length + ".");
		}
		this.id = id;
		this.source = source;
		this.material = material;
	}

	public String id() {
		return id;
	}

	public RootKeySource source() {
		return source;
	}

	/** A new AES key spec for one cipher operation. */
	SecretKeySpec secretKey() {
		if (closed) {
			throw new IllegalStateException(this + " is closed.");
		}
		return new SecretKeySpec(material, "AES");
	}

	@Override
	public void close() {
		closed = true;
		Arrays.fill(material, (byte) 0);
	}

	@Override
	public String toString() {
		return "RootKey[" + id + "]";
	}

}

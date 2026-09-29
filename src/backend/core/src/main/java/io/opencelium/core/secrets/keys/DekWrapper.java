package io.opencelium.core.secrets.keys;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;

import io.opencelium.common.tenant.TenantId;

/**
 * Wraps and unwraps data-encryption keys under the root key with AES-256-GCM. Every wrap uses a new random 12-byte
 * IV. The tenant id and data-key version are authenticated as associated data, so a wrapped key copied to another
 * tenant does not unwrap. GCM makes a wrong root key a clean {@link WrongKeyException}, never wrong key material.
 */
public final class DekWrapper {

	static final int DEK_LENGTH = 32;

	static final int IV_LENGTH = 12;

	private static final int TAG_BITS = 128;

	private static final String TRANSFORMATION = "AES/GCM/NoPadding";

	private final SecureRandom random;

	public DekWrapper() {
		this(new SecureRandom());
	}

	DekWrapper(SecureRandom random) {
		this.random = random;
	}

	public WrappedDek wrap(RootKey rootKey, TenantId tenant, int dekVersion, byte[] dek, Instant createdAt) {
		if (dek.length != DEK_LENGTH) {
			throw new IllegalArgumentException("A data key has " + DEK_LENGTH + " bytes, not " + dek.length + ".");
		}
		byte[] iv = new byte[IV_LENGTH];
		random.nextBytes(iv);
		try {
			Cipher cipher = cipher(Cipher.ENCRYPT_MODE, rootKey, iv, associatedData(tenant.value(), dekVersion));
			return new WrappedDek(null, tenant.value(), rootKey.id(), dekVersion, iv, cipher.doFinal(dek), createdAt);
		}
		catch (GeneralSecurityException ex) {
			throw new IllegalStateException("AES-GCM is not available in this JVM.", ex);
		}
	}

	/**
	 * @return the 32-byte data key; the caller zeroes it after use
	 * @throws WrongKeyException        when {@code rootKey} did not wrap this key, or the document was changed
	 * @throws IllegalArgumentException when the document lacks fields or has fields of the wrong length
	 */
	public byte[] unwrap(RootKey rootKey, WrappedDek wrapped) {
		requireComplete(wrapped);
		try {
			Cipher cipher = cipher(Cipher.DECRYPT_MODE, rootKey, wrapped.iv(),
					associatedData(wrapped.tenantId(), wrapped.dekVersion()));
			return cipher.doFinal(wrapped.ciphertext());
		}
		catch (AEADBadTagException ex) {
			throw new WrongKeyException(rootKey + " cannot unwrap " + wrapped + ".", ex);
		}
		catch (GeneralSecurityException ex) {
			throw new IllegalStateException("AES-GCM is not available in this JVM.", ex);
		}
	}

	private static void requireComplete(WrappedDek wrapped) {
		int ciphertextLength = DEK_LENGTH + TAG_BITS / 8;
		if (wrapped.tenantId() == null) {
			throw damaged(wrapped, "it has no tenantId");
		}
		if (wrapped.iv() == null || wrapped.iv().length != IV_LENGTH) {
			throw damaged(wrapped, "its iv is not " + IV_LENGTH + " bytes");
		}
		if (wrapped.ciphertext() == null || wrapped.ciphertext().length != ciphertextLength) {
			throw damaged(wrapped, "its ciphertext is not " + ciphertextLength + " bytes");
		}
	}

	private static IllegalArgumentException damaged(WrappedDek wrapped, String problem) {
		return new IllegalArgumentException("Stored data key " + wrapped + " is damaged: " + problem + ".");
	}

	private static Cipher cipher(int mode, RootKey rootKey, byte[] iv, byte[] associatedData)
			throws GeneralSecurityException {
		Cipher cipher = Cipher.getInstance(TRANSFORMATION);
		cipher.init(mode, rootKey.secretKey(), new GCMParameterSpec(TAG_BITS, iv));
		cipher.updateAAD(associatedData);
		return cipher;
	}

	private static byte[] associatedData(String tenantId, int dekVersion) {
		return ("opencelium-dek:" + tenantId + ":" + dekVersion).getBytes(StandardCharsets.UTF_8);
	}

}

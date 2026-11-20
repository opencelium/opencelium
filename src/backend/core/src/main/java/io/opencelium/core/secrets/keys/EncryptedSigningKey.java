package io.opencelium.core.secrets.keys;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * The signing key of the installation, encrypted with the system data key by {@link SigningKeyCipher}. Data of the
 * installation itself, not of a tenant: it is in the database that the yml file names, in a collection of its own,
 * because the startup checks read each document of {@code keys} as a wrapped data key.
 *
 * @param version    the version of the signing key, from 1; a unique index accepts 1 document for each version
 * @param iv         12-byte GCM nonce, new for each encryption
 * @param ciphertext the encrypted 32-byte key followed by the 16-byte GCM tag
 */
@Document(EncryptedSigningKey.COLLECTION)
public record EncryptedSigningKey(@Id String id, int version, byte[] iv, byte[] ciphertext, Instant createdAt) {

	/** The collection of the signing keys, in the database that the yml file names. */
	public static final String COLLECTION = "signing_keys";

}

package io.opencelium.core.secrets;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * 1 secret, encrypted with the DEK of its owner. The secrets of the installation are in the database that the yml
 * file names.
 *
 * @param id         the secret ID, which the secret reference names
 * @param tenantId   the owner of the secret: the reserved tenant {@code system} for a secret of the installation
 * @param dekVersion the version of the DEK that encrypted the secret
 * @param iv         the 12-byte GCM nonce, new for each encryption
 * @param ciphertext the encrypted value followed by the 16-byte GCM tag
 */
@Document(SecretDocument.COLLECTION)
record SecretDocument(@Id String id, String tenantId, int dekVersion, byte[] iv, byte[] ciphertext,
		Instant createdAt) {

	/** The collection of the secrets. */
	static final String COLLECTION = "secrets";

}

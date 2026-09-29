package io.opencelium.core.secrets.keys;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A tenant's data-encryption key (DEK), wrapped under the root key with AES-256-GCM by {@link DekWrapper}. Stored in
 * the tenant's own database (decision #14); deleting it makes that tenant's secrets unrecoverable. The secret store
 * (OC-1584 Task 4) creates these; at startup {@link KeyStartupCanary} only checks that one unwraps.
 *
 * @param rootKeyId  id of the root key that wrapped it ({@link RootKey#id()}), for root-key rotation
 * @param dekVersion version of the tenant's data key, from 1, for data-key rotation
 * @param iv         12-byte GCM nonce, new for every wrap
 * @param ciphertext the wrapped 32-byte key followed by the 16-byte GCM tag
 */
@Document("keys")
public record WrappedDek(@Id String id, String tenantId, String rootKeyId, int dekVersion, byte[] iv,
		byte[] ciphertext, Instant createdAt) {

	@Override
	public String toString() {
		return "WrappedDek[id=" + id + ", tenant=" + tenantId + ", rootKeyId=" + rootKeyId + ", dekVersion="
				+ dekVersion + "]";
	}

}

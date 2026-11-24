package io.opencelium.core.secrets;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;

import org.junit.jupiter.api.Test;

import io.opencelium.common.tenant.TenantId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A secret decrypts only with the DEK that encrypted it, and only as the secret of the same owner, ID and DEK
 * version.
 */
class SecretCipherTest {

	private static final byte[] DEK = new byte[32];

	private static final byte[] PLAINTEXT = "s3cret-value".getBytes(StandardCharsets.UTF_8);

	private static final Instant NOW = Instant.parse("2026-11-24T10:00:00Z");

	private final SecretCipher cipher = new SecretCipher();

	static {
		Arrays.fill(DEK, (byte) 7);
	}

	@Test
	void encryptUsesANewIvWhenItRunsTwice() {
		SecretDocument first = cipher.encrypt(DEK, TenantId.SYSTEM, "secret-1", 1, PLAINTEXT, NOW);
		SecretDocument second = cipher.encrypt(DEK, TenantId.SYSTEM, "secret-1", 1, PLAINTEXT, NOW);

		assertThat(first.iv()).hasSize(12).isNotEqualTo(second.iv());
		assertThat(first.ciphertext()).isNotEqualTo(second.ciphertext());
	}

	@Test
	void decryptGivesThePlaintextWhenTheOwnerTheIdAndTheVersionAreTheSame() {
		SecretDocument stored = cipher.encrypt(DEK, TenantId.SYSTEM, "secret-1", 1, PLAINTEXT, NOW);

		assertThat(stored.id()).isEqualTo("secret-1");
		assertThat(stored.tenantId()).isEqualTo("system");
		assertThat(stored.dekVersion()).isEqualTo(1);
		assertThat(cipher.decrypt(DEK, stored)).isEqualTo(PLAINTEXT);
	}

	@Test
	void decryptStopsWhenTheSecretIdIsDifferent() {
		SecretDocument stored = cipher.encrypt(DEK, TenantId.SYSTEM, "secret-1", 1, PLAINTEXT, NOW);
		var copied = new SecretDocument("secret-2", stored.tenantId(), stored.dekVersion(), stored.iv(),
				stored.ciphertext(), stored.createdAt());

		assertThatThrownBy(() -> cipher.decrypt(DEK, copied)).isInstanceOf(SecretDecryptionException.class)
				.hasMessageContaining("secret-2").hasMessageNotContaining("s3cret");
	}

	@Test
	void decryptStopsWhenTheOwnerIsDifferent() {
		SecretDocument stored = cipher.encrypt(DEK, TenantId.SYSTEM, "secret-1", 1, PLAINTEXT, NOW);
		var copied = new SecretDocument(stored.id(), "tenant-a", stored.dekVersion(), stored.iv(), stored.ciphertext(),
				stored.createdAt());

		assertThatThrownBy(() -> cipher.decrypt(DEK, copied)).isInstanceOf(SecretDecryptionException.class);
	}

	@Test
	void decryptStopsWhenTheCiphertextIsChanged() {
		SecretDocument stored = cipher.encrypt(DEK, TenantId.SYSTEM, "secret-1", 1, PLAINTEXT, NOW);
		byte[] changed = stored.ciphertext().clone();
		changed[0] ^= 1;
		var tampered = new SecretDocument(stored.id(), stored.tenantId(), stored.dekVersion(), stored.iv(), changed,
				stored.createdAt());

		assertThatThrownBy(() -> cipher.decrypt(DEK, tampered)).isInstanceOf(SecretDecryptionException.class);
	}

}

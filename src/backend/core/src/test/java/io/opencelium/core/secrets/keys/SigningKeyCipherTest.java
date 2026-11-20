package io.opencelium.core.secrets.keys;

import java.security.SecureRandom;
import java.time.Instant;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class SigningKeyCipherTest {

	private static final Instant NOW = Instant.parse("2026-11-20T10:00:00Z");

	private final SigningKeyCipher cipher = new SigningKeyCipher();

	private final byte[] systemDek = randomBytes(32);

	private final byte[] signingKey = randomBytes(32);

	@Test
	void encryptUsesANewIvWhenItRunsTwice() {
		EncryptedSigningKey first = cipher.encrypt(systemDek, 1, signingKey, NOW);
		EncryptedSigningKey second = cipher.encrypt(systemDek, 1, signingKey, NOW);

		assertThat(first.iv()).hasSize(12).isNotEqualTo(second.iv());
		assertThat(first.ciphertext()).isNotEqualTo(second.ciphertext());
	}

	@Test
	void decryptGivesTheKeyWhenTheSystemDekIsTheSame() {
		EncryptedSigningKey stored = cipher.encrypt(systemDek, 1, signingKey, NOW);

		assertThat(cipher.decrypt(systemDek, stored)).isEqualTo(signingKey);
	}

	@Test
	void decryptStopsWhenTheSystemDekIsDifferent() {
		EncryptedSigningKey stored = cipher.encrypt(systemDek, 1, signingKey, NOW);

		assertThatExceptionOfType(WrongKeyException.class).isThrownBy(() -> cipher.decrypt(randomBytes(32), stored));
	}

	@Test
	void decryptStopsWhenTheVersionInTheAssociatedDataIsDifferent() {
		EncryptedSigningKey stored = cipher.encrypt(systemDek, 1, signingKey, NOW);
		var otherVersion = new EncryptedSigningKey(stored.id(), 2, stored.iv(), stored.ciphertext(), stored.createdAt());

		assertThatExceptionOfType(WrongKeyException.class).isThrownBy(() -> cipher.decrypt(systemDek, otherVersion));
	}

	@Test
	void decryptStopsWhenTheCiphertextIsChanged() {
		EncryptedSigningKey stored = cipher.encrypt(systemDek, 1, signingKey, NOW);
		byte[] changed = stored.ciphertext().clone();
		changed[0] ^= 1;
		var tampered = new EncryptedSigningKey(stored.id(), stored.version(), stored.iv(), changed, stored.createdAt());

		assertThatExceptionOfType(WrongKeyException.class).isThrownBy(() -> cipher.decrypt(systemDek, tampered));
	}

	@Test
	void decryptStopsWithTheProblemWhenTheDocumentIsDamaged() {
		var damaged = new EncryptedSigningKey("id-1", 1, new byte[12], null, NOW);

		assertThatIllegalArgumentException().isThrownBy(() -> cipher.decrypt(systemDek, damaged))
				.withMessageContaining("id-1").withMessageContaining("damaged").withMessageContaining("ciphertext");
	}

	private static byte[] randomBytes(int length) {
		byte[] bytes = new byte[length];
		new SecureRandom().nextBytes(bytes);
		return bytes;
	}

}

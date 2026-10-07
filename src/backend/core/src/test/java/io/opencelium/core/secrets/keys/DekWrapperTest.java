package io.opencelium.core.secrets.keys;

import java.security.SecureRandom;
import java.time.Instant;

import javax.crypto.AEADBadTagException;

import org.junit.jupiter.api.Test;

import io.opencelium.common.tenant.TenantId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class DekWrapperTest {

	private static final Instant NOW = Instant.parse("2026-09-28T10:00:00Z");

	private final DekWrapper wrapper = new DekWrapper();

	@Test
	void unwrapReturnsTheWrappedKey() {
		RootKey rootKey = randomRootKey();
		byte[] dek = randomBytes(32);

		WrappedDek wrapped = wrapper.wrap(rootKey, TenantId.SELF, 1, dek, NOW);

		assertThat(wrapper.unwrap(rootKey, wrapped)).isEqualTo(dek);
		assertThat(wrapped.tenantId()).isEqualTo("self");
		assertThat(wrapped.rootKeyId()).isEqualTo("k-01");
		assertThat(wrapped.dekVersion()).isEqualTo(1);
		assertThat(wrapped.createdAt()).isEqualTo(NOW);
		assertThat(wrapped.ciphertext()).isNotEqualTo(dek);
	}

	@Test
	void unwrapWithAnotherRootKeyThrowsWrongKeyException() {
		WrappedDek wrapped = wrapper.wrap(randomRootKey(), TenantId.SELF, 1, randomBytes(32), NOW);

		assertThatExceptionOfType(WrongKeyException.class)
				.isThrownBy(() -> wrapper.unwrap(randomRootKey(), wrapped))
				.withCauseInstanceOf(AEADBadTagException.class);
	}

	@Test
	void unwrapThrowsWrongKeyExceptionWhenTheDocumentWasMovedToAnotherTenant() {
		RootKey rootKey = randomRootKey();
		WrappedDek wrapped = wrapper.wrap(rootKey, TenantId.SELF, 1, randomBytes(32), NOW);
		var moved = new WrappedDek(wrapped.id(), "other", wrapped.rootKeyId(), wrapped.dekVersion(), wrapped.iv(),
				wrapped.ciphertext(), wrapped.createdAt());

		assertThatExceptionOfType(WrongKeyException.class).isThrownBy(() -> wrapper.unwrap(rootKey, moved));
	}

	@Test
	void wrapUsesANewIvEveryTime() {
		RootKey rootKey = randomRootKey();
		byte[] dek = randomBytes(32);

		WrappedDek first = wrapper.wrap(rootKey, TenantId.SELF, 1, dek, NOW);
		WrappedDek second = wrapper.wrap(rootKey, TenantId.SELF, 1, dek, NOW);

		assertThat(first.iv()).hasSize(12).isNotEqualTo(second.iv());
		assertThat(first.ciphertext()).isNotEqualTo(second.ciphertext());
	}

	@Test
	void unwrapRejectsADamagedDocumentNamingTheProblem() {
		var damaged = new WrappedDek("id-1", TenantId.SELF.value(), RootKey.INITIAL_ID, 1, null, new byte[48], NOW);

		assertThatIllegalArgumentException().isThrownBy(() -> wrapper.unwrap(randomRootKey(), damaged))
				.withMessageContaining("id-1").withMessageContaining("damaged").withMessageContaining("iv");
	}

	@Test
	void toStringShowsNoKeyBytes() {
		WrappedDek wrapped = wrapper.wrap(randomRootKey(), TenantId.SELF, 1, randomBytes(32), NOW);

		assertThat(wrapped.toString()).doesNotContain("[B@").contains("tenant=self").contains("rootKeyId=k-01");
	}

	static RootKey randomRootKey() {
		return new RootKey(RootKey.INITIAL_ID, RootKeySource.ENV, randomBytes(32));
	}

	private static byte[] randomBytes(int length) {
		byte[] bytes = new byte[length];
		new SecureRandom().nextBytes(bytes);
		return bytes;
	}

}

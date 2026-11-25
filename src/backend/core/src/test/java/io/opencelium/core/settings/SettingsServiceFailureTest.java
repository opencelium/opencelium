package io.opencelium.core.settings;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.bson.Document;
import org.junit.jupiter.api.Test;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * A failure in the middle of a change of a secret setting leaves no new ciphertext behind when the update fails, and
 * keeps the change when only the delete of the replaced secret fails.
 */
class SettingsServiceFailureTest {

	private final SettingRegistry registry = new SettingRegistry(List.of(BrokerSettings.PASSWORD));

	private final SettingsRepository repository = mock(SettingsRepository.class);

	private final RecordingSecrets secrets = new RecordingSecrets();

	private final SettingsService settings = new SettingsService(registry, repository, secrets);

	@Test
	void changeDeletesTheNewSecretWhenTheUpdateFails() {
		when(repository.change(anyMap(), anyCollection())).thenThrow(new IllegalStateException("the database is down"));

		assertThatThrownBy(() -> settings.change(Map.of("broker.password", "Pass-1")))
				.hasMessage("the database is down");

		assertThat(secrets.stored).hasSize(1);
		assertThat(secrets.deleted).isEqualTo(secrets.stored);
	}

	@Test
	void changeKeepsTheCauseWhenTheDeleteOfTheNewSecretAlsoFails() {
		when(repository.change(anyMap(), anyCollection())).thenThrow(new IllegalStateException("the database is down"));
		secrets.failDeletes = true;

		assertThatThrownBy(() -> settings.change(Map.of("broker.password", "Pass-1")))
				.hasMessage("the database is down")
				.satisfies(thrown -> assertThat(thrown.getSuppressed()).singleElement()
					.extracting(Throwable::getMessage).isEqualTo("the delete failed"));
	}

	@Test
	void changeGivesTheNewValuesWhenTheReplacedSecretDoesNotDelete() {
		Document before = new Document("broker",
				new Document("password", new Document("owner", "system").append("id", "old-secret")));
		when(repository.change(anyMap(), anyCollection())).thenReturn(Optional.of(before));
		when(repository.installationValues()).thenReturn(Optional.of(new Document("broker",
				new Document("password", new Document("owner", "system").append("id", "new-secret")))));
		secrets.failDeletes = true;

		var after = settings.change(Map.of("broker.password", "Pass-2"));

		assertThat(after).containsExactly(new SettingsService.SettingValue("broker.password", "****", false));
		assertThat(secrets.deleted).containsExactly(new SecretReference(TenantId.SYSTEM, "old-secret"));
	}

	/** A secret provider that records each store and each delete, and fails the deletes on demand. */
	private static final class RecordingSecrets implements SecretProvider {

		private final List<SecretReference> stored = new ArrayList<>();

		private final Collection<SecretReference> deleted = new ArrayList<>();

		private boolean failDeletes;

		@Override
		public SecretReference store(TenantId owner, byte[] plaintext) {
			var reference = new SecretReference(owner, "new-" + stored.size());
			stored.add(reference);
			return reference;
		}

		@Override
		public byte[] read(SecretReference reference) {
			throw new UnsupportedOperationException("a change never reads a secret");
		}

		@Override
		public void delete(SecretReference reference) {
			deleted.add(reference);
			if (failDeletes) {
				throw new IllegalStateException("the delete failed");
			}
		}

	}

}

package io.opencelium.core.settings;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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
 * keeps the change when only the delete of the replaced secret fails. The same applies to the secret of an item of a
 * list setting.
 */
class SettingsServiceFailureTest {

	/** A list setting of the test: accounts at remote systems, each with the password for its address. */
	private static final SettingDefinition ACCOUNTS = new SettingDefinition("remote.accounts", SettingType.LIST,
			List.of(), 0, 10,
			new SettingList(List.of(new SettingList.ItemField("id", SettingType.TEXT, null, 1, 20),
					new SettingList.ItemField("address", SettingType.TEXT, null, 1, 200),
					new SettingList.ItemField("password", SettingType.SECRET, null, 1, 100)), "id", "password",
					"address"),
			null);

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
	void changeDeletesTheNewSecretOfAListItemWhenTheUpdateFails() {
		var listSettings = new SettingsService(new SettingRegistry(List.of(ACCOUNTS)), repository, secrets);
		when(repository.installationValues()).thenReturn(Optional.empty());
		when(repository.change(anyMap(), anyCollection())).thenThrow(new IllegalStateException("the database is down"));
		Map<String, Object> account = new LinkedHashMap<>();
		account.put("id", "a");
		account.put("address", "https://a.example.com");
		account.put("password", UUID.randomUUID().toString());

		assertThatThrownBy(() -> listSettings.change(Map.of("remote.accounts", List.of(account))))
			.isExactlyInstanceOf(IllegalStateException.class)
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

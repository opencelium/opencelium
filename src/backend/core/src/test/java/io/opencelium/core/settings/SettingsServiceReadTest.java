package io.opencelium.core.settings;

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
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * A feature reads the items of its list setting through the setting reader: each stored item with the secret
 * reference in its secret field, never the mask of the settings API and never a plaintext. An item whose stored
 * secret field is not a valid secret reference has no secret field. The default items apply when the database has no
 * value, and a setting key that is not a list setting has no items.
 */
class SettingsServiceReadTest {

	private static final String KEY = "remote.accounts";

	/** The default item of the list setting of the test: an account without a password. */
	private static final Map<String, Object> DEFAULT_ACCOUNT = Map.of("id", "local", "address",
			"https://local.example.com");

	/**
	 * A list setting of the test: accounts at remote systems, each with the password for its address, and 1 account by
	 * default.
	 */
	private static final SettingDefinition ACCOUNTS = new SettingDefinition(KEY, SettingType.LIST,
			List.of(DEFAULT_ACCOUNT), 0, 10,
			new SettingList(List.of(new SettingList.ItemField("id", SettingType.TEXT, null, 1, 20),
					new SettingList.ItemField("address", SettingType.TEXT, null, 1, 200),
					new SettingList.ItemField("password", SettingType.SECRET, null, 1, 100)), "id", "password",
					"address"),
			null);

	private final SettingsRepository repository = mock(SettingsRepository.class);

	private final SettingReader settings = new SettingsService(
			new SettingRegistry(List.of(ACCOUNTS, BrokerSettings.PASSWORD)), repository, mock(SecretProvider.class));

	@Test
	void itemsGivesTheSecretReferenceInTheSecretFieldWhenTheItemHasAStoredSecret() {
		String secretId = UUID.randomUUID().toString();
		storeItems(new Document("id", "erp").append("address", "https://erp.example.com")
			.append("password", new Document("owner", "system").append("id", secretId)));

		List<Map<String, Object>> items = settings.items(KEY);

		assertThat(items).hasSize(1);
		assertThat(items.getFirst()).containsEntry("id", "erp")
			.containsEntry("address", "https://erp.example.com")
			.containsEntry("password", new SecretReference(TenantId.SYSTEM, secretId));
	}

	@Test
	void itemsGivesNoSecretFieldWhenTheStoredSecretIsNotASecretReference() {
		storeItems(new Document("id", "erp").append("address", "https://erp.example.com").append("password", "****"),
				new Document("id", "crm").append("address", "https://crm.example.com")
					.append("password", new Document("owner", "system")));

		List<Map<String, Object>> items = settings.items(KEY);

		assertThat(items).extracting(item -> item.get("id")).containsExactly("erp", "crm");
		assertThat(items).allSatisfy(item -> assertThat(item).doesNotContainKey("password"));
	}

	@Test
	void itemsGivesTheDefaultItemsWhenTheDatabaseHasNoValue() {
		when(repository.installationValues()).thenReturn(Optional.empty());

		assertThat(settings.items(KEY)).containsExactly(DEFAULT_ACCOUNT);
	}

	@Test
	void itemsThrowsIllegalArgumentExceptionWhenTheSettingIsNotAList() {
		when(repository.installationValues()).thenReturn(Optional.empty());

		assertThatExceptionOfType(IllegalArgumentException.class)
			.isThrownBy(() -> settings.items(BrokerSettings.PASSWORD.key()));
	}

	@Test
	void itemsThrowsIllegalArgumentExceptionWhenNoSettingHasTheKey() {
		when(repository.installationValues()).thenReturn(Optional.empty());

		assertThatExceptionOfType(IllegalArgumentException.class).isThrownBy(() -> settings.items("remote.unknown"));
	}

	/** The installation settings document with the items in the field of the setting key. */
	private void storeItems(Document... items) {
		when(repository.installationValues()).thenReturn(Optional.of(
				new Document("_id", "installation").append("remote", new Document("accounts", List.of(items)))));
	}

}

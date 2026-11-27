package io.opencelium.core.settings;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.settings.SettingList.ItemField;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A setting with a list of items: the form of a change, the mask of a read, the secret that an item keeps, and the
 * secrets to delete after an update. The list of the cases is a list of accounts at remote systems: each item has an
 * ID, a name, the address of the remote system, a password for it, and an option that is off by default. The
 * database keeps the password of an item as a secret reference with the owner and the secret ID.
 */
class SettingListTest {

	private static final SettingList ACCOUNTS = new SettingList(List.of(
			new ItemField("id", SettingType.TEXT, null, 1, 20), new ItemField("name", SettingType.TEXT, null, 1, 50),
			new ItemField("address", SettingType.TEXT, null, 1, 200),
			new ItemField("password", SettingType.SECRET, null, 1, 100),
			new ItemField("active", SettingType.BOOLEAN, false, 0, 0)), "id", "password", "address");

	private static final String ADDRESS_A = "https://a.example.com";

	private static final String ADDRESS_B = "https://b.example.com";

	@Test
	void validateAcceptsTheListWhenEachItemHasEachFieldInItsForm() {
		assertThat(ACCOUNTS
			.validate(List.of(change("a", ADDRESS_A, newPassword()), change("b", ADDRESS_B, newPassword())))).isTrue();
		assertThat(ACCOUNTS.validate(List.of(with(change("a", ADDRESS_A, newPassword()), "active", true)))).isTrue();
	}

	@Test
	void validateAcceptsTheEmptyList() {
		assertThat(ACCOUNTS.validate(List.of())).isTrue();
	}

	@Test
	void validateAcceptsAnItemWhenItHasNoSecret() {
		assertThat(ACCOUNTS.validate(List.of(change("a", ADDRESS_A, null)))).isTrue();
	}

	@Test
	void validateRefusesAnItemWhenItsSecretIsTheMask() {
		assertThat(ACCOUNTS.validate(List.of(change("a", ADDRESS_A, "****")))).isFalse();
	}

	@Test
	void validateRefusesTheListWhenTwoItemsHaveTheSameId() {
		assertThat(ACCOUNTS
			.validate(List.of(change("a", ADDRESS_A, newPassword()), change("a", ADDRESS_B, newPassword())))).isFalse();
	}

	@Test
	void validateRefusesAnItemWhenItHasNoId() {
		Map<String, Object> withoutId = change("a", ADDRESS_A, newPassword());
		withoutId.remove("id");

		assertThat(ACCOUNTS.validate(List.of(withoutId))).isFalse();
	}

	@Test
	void validateRefusesAnItemWhenAFieldWithoutADefaultIsMissing() {
		Map<String, Object> withoutAddress = change("a", ADDRESS_A, newPassword());
		withoutAddress.remove("address");

		assertThat(ACCOUNTS.validate(List.of(withoutAddress))).isFalse();
	}

	@Test
	void validateRefusesAnItemWhenAFieldHasAnotherJsonType() {
		assertThat(ACCOUNTS.validate(List.of(with(change("a", ADDRESS_A, newPassword()), "active", "yes")))).isFalse();
		assertThat(ACCOUNTS.validate(List.of(with(change("a", ADDRESS_A, newPassword()), "name", 5)))).isFalse();
	}

	@Test
	void validateRefusesAnItemWhenAFieldIsOutsideItsBounds() {
		assertThat(ACCOUNTS.validate(List.of(with(change("a", ADDRESS_A, newPassword()), "name", "n".repeat(51)))))
				.isFalse();
		assertThat(ACCOUNTS.validate(List.of(with(change("a", ADDRESS_A, newPassword()), "name", "")))).isFalse();
	}

	@Test
	void validateRefusesAnItemWhenItHasAFieldThatTheListDoesNotName() {
		assertThat(ACCOUNTS.validate(List.of(with(change("a", ADDRESS_A, newPassword()), "port", 443)))).isFalse();
	}

	@Test
	void validateRefusesTheValueWhenItIsNotAListOfObjects() {
		assertThat(ACCOUNTS.validate("a")).isFalse();
		assertThat(ACCOUNTS.validate(change("a", ADDRESS_A, newPassword()))).isFalse();
		assertThat(ACCOUNTS.validate(List.of("a"))).isFalse();
	}

	@Test
	void maskedShowsTheMaskInPlaceOfTheSecretReferenceWhenAnItemHasASecret() {
		List<Map<String, Object>> read = ACCOUNTS
			.masked(List.of(with(stored("a", ADDRESS_A, "secret-of-a"), "active", true)));

		assertThat(read).containsExactly(Map.of("id", "a", "name", "Account a", "address", ADDRESS_A, "password",
				"****", "active", true));
		assertThat(read.toString()).doesNotContain("secret-of-a").doesNotContain("system");
	}

	@Test
	void maskedGivesTheDefaultWhenAStoredItemHasNoValueForAField() {
		List<Map<String, Object>> read = ACCOUNTS.masked(List.of(stored("a", ADDRESS_A, "secret-of-a")));

		assertThat(read).singleElement().satisfies(item -> assertThat(item).containsEntry("active", false));
	}

	@Test
	void maskedKeepsTheOrderOfTheStoredItems() {
		List<Map<String, Object>> read = ACCOUNTS
			.masked(List.of(stored("b", ADDRESS_B, "secret-of-b"), stored("a", ADDRESS_A, "secret-of-a")));

		assertThat(read).extracting(item -> item.get("id")).containsExactly("b", "a");
	}

	@Test
	void keptSecretsKeepsTheStoredSecretWhenTheItemHasNoSecretAndTheSameAddress() {
		var stored = List.of(stored("a", ADDRESS_A, "secret-of-a"));
		var change = List.of(with(change("a", ADDRESS_A, null), "name", "Renamed account"));

		assertThat(ACCOUNTS.keptSecrets(stored, change))
			.contains(Map.of("a", new SecretReference(TenantId.SYSTEM, "secret-of-a")));
	}

	@Test
	void keptSecretsIsEmptyWhenTheItemHasNoSecretAndANewAddress() {
		var stored = List.of(stored("a", ADDRESS_A, "secret-of-a"));

		assertThat(ACCOUNTS.keptSecrets(stored, List.of(change("a", ADDRESS_B, null)))).isEmpty();
	}

	@Test
	void keptSecretsIsEmptyWhenANewItemHasNoSecret() {
		var stored = List.of(stored("a", ADDRESS_A, "secret-of-a"));

		assertThat(ACCOUNTS.keptSecrets(stored, List.of(change("a", ADDRESS_A, null), change("b", ADDRESS_B, null))))
			.isEmpty();
	}

	@Test
	void keptSecretsKeepsNoSecretOfAnItemWhenTheItemGivesANewSecret() {
		var stored = List.of(stored("a", ADDRESS_A, "secret-of-a"), stored("b", ADDRESS_B, "secret-of-b"));
		var change = List.of(change("a", "https://a2.example.com", newPassword()), change("b", ADDRESS_B, null));

		assertThat(ACCOUNTS.keptSecrets(stored, change))
			.contains(Map.of("b", new SecretReference(TenantId.SYSTEM, "secret-of-b")));
	}

	@Test
	void removedSecretsGivesTheSecretOfAnItemWhenTheItemIsRemoved() {
		var before = List.of(stored("a", ADDRESS_A, "secret-of-a"), stored("b", ADDRESS_B, "secret-of-b"));
		var after = List.of(stored("a", ADDRESS_A, "secret-of-a"));

		assertThat(ACCOUNTS.removedSecrets(before, after))
			.containsExactly(new SecretReference(TenantId.SYSTEM, "secret-of-b"));
	}

	@Test
	void removedSecretsGivesTheReplacedSecretWhenAnItemHasANewSecret() {
		var before = List.of(stored("a", ADDRESS_A, "secret-of-a"));
		var after = List.of(stored("a", ADDRESS_A, "new-secret-of-a"));

		assertThat(ACCOUNTS.removedSecrets(before, after))
			.containsExactly(new SecretReference(TenantId.SYSTEM, "secret-of-a"));
	}

	@Test
	void removedSecretsGivesEachSecretWhenTheListIsReset() {
		var before = List.of(stored("a", ADDRESS_A, "secret-of-a"), stored("b", ADDRESS_B, "secret-of-b"));

		assertThat(ACCOUNTS.removedSecrets(before, List.of())).containsExactlyInAnyOrder(
				new SecretReference(TenantId.SYSTEM, "secret-of-a"),
				new SecretReference(TenantId.SYSTEM, "secret-of-b"));
	}

	@Test
	void removedSecretsIsEmptyWhenEachItemKeepsItsSecret() {
		var before = List.of(stored("a", ADDRESS_A, "secret-of-a"));
		var after = List.of(with(stored("a", ADDRESS_A, "secret-of-a"), "name", "Renamed account"));

		assertThat(ACCOUNTS.removedSecrets(before, after)).isEmpty();
	}

	/** An item of a change as the JSON parser gives it; without the password when {@code password} is null. */
	private static Map<String, Object> change(String id, String address, String password) {
		Map<String, Object> item = new LinkedHashMap<>();
		item.put("id", id);
		item.put("name", "Account " + id);
		item.put("address", address);
		if (password != null) {
			item.put("password", password);
		}
		return item;
	}

	/** An item as the database keeps it: the password is a secret reference of the installation. */
	private static Map<String, Object> stored(String id, String address, String secretId) {
		Map<String, Object> item = new LinkedHashMap<>();
		item.put("id", id);
		item.put("name", "Account " + id);
		item.put("address", address);
		item.put("password", Map.of("owner", TenantId.SYSTEM.value(), "id", secretId));
		return item;
	}

	/** A new random password, so that no password of the cases is fixed in the code. */
	private static String newPassword() {
		return UUID.randomUUID().toString();
	}

	private static Map<String, Object> with(Map<String, Object> item, String field, Object value) {
		item.put(field, value);
		return item;
	}

}

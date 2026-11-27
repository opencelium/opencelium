package io.opencelium.core.settings;

import java.util.List;
import java.util.Map;

/**
 * The read of an installation setting for a feature outside this package. It gives the value of the database, or the
 * default when the database has none, and it has no method that changes a setting: the settings service itself is not
 * visible outside the package. It never gives a plaintext secret and never the mask of a read of the settings API.
 */
public interface SettingReader {

	/**
	 * The items of a list setting, read from the database at each call: nothing is cached, so a change of another
	 * core instance is visible at the next call. An item has each field of the list that it has a value or a default
	 * for, in the order of the fields of the list. The secret field of an item holds its
	 * {@link io.opencelium.common.secret.SecretReference}, which the feature gives to the secret provider at the moment
	 * of use, and not the secret.
	 *
	 * @param key the setting key of a list setting
	 * @return the items in their order; empty when the setting has no value and no default items
	 * @throws IllegalArgumentException when no setting has the setting key, or the setting is not a list
	 */
	List<Map<String, Object>> items(String key);

}

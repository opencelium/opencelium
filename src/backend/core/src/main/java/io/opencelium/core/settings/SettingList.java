package io.opencelium.core.settings;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import io.opencelium.common.secret.SecretReference;

/**
 * The form of a setting whose value is a list of items, for example the OIDC providers of the installation. It names
 * the fields of an item, the ID field, and at most 1 secret field with the address field that the secret belongs to.
 * The settings package knows no feature: a feature declares its list in its setting definition.
 * <p>
 * A change gives the full list. The database keeps each item with a secret reference in its secret field, in the
 * form of a secret setting: a subdocument with the owner and the secret ID. A read shows the mask
 * {@value SettingsService#MASK} in place of each secret reference, so a client can send a read back: an item without
 * a secret keeps the secret of the stored item with the same ID. An item with a new address must give its secret
 * again, so core sends a kept secret only to the address that it was given for.
 *
 * @param fields       the fields of an item, in the order of a read
 * @param idField      the name of the field that identifies an item; its value is unique in the list
 * @param secretField  the name of the field of type {@link SettingType#SECRET}, or {@code null} when an item has no
 *                     secret
 * @param addressField the name of the field with the address that the secret of an item is sent to, or {@code null}
 *                     when an item has no secret
 */
public record SettingList(List<ItemField> fields, String idField, String secretField, String addressField) {

	/**
	 * Examines the form of the value of a change, without the stored items:
	 * <ul>
	 * <li>The value is a JSON array of JSON objects, and each object has only the fields of the list.</li>
	 * <li>Each field has the JSON form of its type and is inside its bounds. The mask is not a valid secret.</li>
	 * <li>Each item has each field without a default, except the secret field: an item without a secret can keep the
	 * stored one.</li>
	 * <li>No 2 items have the same ID.</li>
	 * </ul>
	 *
	 * @param value the value of a change, never {@code null}
	 * @return {@code true} when the value has the form of this list
	 */
	boolean validate(Object value) {
		throw new UnsupportedOperationException();
	}

	/**
	 * The value of a read and of the response to a change: each stored item with each field of the list, the default
	 * of a field that the stored item has no value for, and the mask in place of a secret reference. It never gives
	 * the secret reference.
	 *
	 * @param stored the items as the database keeps them
	 * @return the items as the settings API shows them, in the order of {@code stored}
	 */
	List<Map<String, Object>> masked(List<? extends Map<String, ?>> stored) {
		throw new UnsupportedOperationException();
	}

	/**
	 * The secrets that the items of a change keep. An item without a secret keeps the secret reference of the stored
	 * item with the same ID, when the 2 items have the same address.
	 *
	 * @param stored the items as the database keeps them
	 * @param change the items of a change whose form {@link #validate} accepts
	 * @return the ID of each item of the change without a secret, with the secret reference that it keeps; empty
	 *         when an item without a secret has a new ID or a new address, so that the change is not valid
	 */
	Optional<Map<String, SecretReference>> keptSecrets(List<? extends Map<String, ?>> stored,
			List<? extends Map<String, ?>> change) {
		throw new UnsupportedOperationException();
	}

	/**
	 * The secrets to delete after an update: each secret reference of the items before the update that no item after
	 * the update holds. These are the secrets of the removed items and the replaced secrets; after a reset of the
	 * setting, each secret of the items before it.
	 *
	 * @param before the items as the database kept them before the update
	 * @param after  the items as the database keeps them after the update; empty after a reset
	 * @return the secret references to delete
	 */
	List<SecretReference> removedSecrets(List<? extends Map<String, ?>> before, List<? extends Map<String, ?>> after) {
		throw new UnsupportedOperationException();
	}

	/**
	 * 1 field of an item.
	 *
	 * @param name         the name of the field in the JSON form of an item
	 * @param type         the type of the value; {@link SettingType#LIST} is not a type of a field
	 * @param defaultValue the value of an item without the field, or {@code null} when each item must have the field
	 * @param min          the lower bound of a valid value, as in a setting definition
	 * @param max          the upper bound of a valid value, as in a setting definition
	 */
	public record ItemField(String name, SettingType type, Object defaultValue, int min, int max) {

	}

}

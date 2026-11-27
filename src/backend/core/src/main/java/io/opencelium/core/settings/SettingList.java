package io.opencelium.core.settings;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

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
 * @param idField      the name of the text field that identifies an item; its value is unique in the list
 * @param secretField  the name of the field of type {@link SettingType#SECRET}, or {@code null} when an item has no
 *                     secret; no other field has the type {@link SettingType#SECRET}, because the database would keep
 *                     its value as plaintext
 * @param addressField the name of the text field with the address that the secret of an item is sent to, or
 *                     {@code null} when an item has no secret
 */
public record SettingList(List<ItemField> fields, String idField, String secretField, String addressField) {

	/**
	 * @throws IllegalArgumentException when the names do not fit the fields, as described at the components; a list
	 *                                  with such a form is a mistake of the feature, found at the start
	 */
	public SettingList {
		fields = List.copyOf(fields);
		if (!hasField(fields, idField, SettingType.TEXT)) {
			throw new IllegalArgumentException("The ID field of a list setting is not a text field of the list.");
		}
		if (fields.stream()
			.anyMatch(field -> field.type() == SettingType.SECRET && !field.name().equals(secretField))) {
			throw new IllegalArgumentException("A list setting has a secret field that is not its secret field.");
		}
		if (secretField != null && !(hasField(fields, secretField, SettingType.SECRET)
				&& hasField(fields, addressField, SettingType.TEXT))) {
			throw new IllegalArgumentException("The secret field of a list setting is not a secret field,"
					+ " or its address field is not a text field.");
		}
	}

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
		if (!(value instanceof List<?> items)) {
			return false;
		}
		Set<Object> ids = new HashSet<>();
		for (Object item : items) {
			if (!(item instanceof Map<?, ?> itemFields) || !hasValidFields(itemFields)
					|| !ids.add(itemFields.get(idField))) {
				return false;
			}
		}
		return true;
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
		List<Map<String, Object>> shown = new ArrayList<>();
		for (Map<String, ?> item : stored) {
			Map<String, Object> shownItem = new LinkedHashMap<>();
			for (ItemField field : fields) {
				Object value = item.get(field.name());
				if (field.name().equals(secretField)) {
					if (value != null) {
						shownItem.put(field.name(), SettingsService.MASK);
					}
				}
				else if (value != null || field.defaultValue() != null) {
					shownItem.put(field.name(), value != null ? value : field.defaultValue());
				}
			}
			shown.add(shownItem);
		}
		return shown;
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
		Map<String, SecretReference> kept = new LinkedHashMap<>();
		if (secretField == null) {
			return Optional.of(kept);
		}
		Map<Object, Map<String, ?>> storedById = new LinkedHashMap<>();
		stored.forEach(item -> storedById.put(item.get(idField), item));
		for (Map<String, ?> item : change) {
			if (item.containsKey(secretField)) {
				continue;
			}
			Optional<SecretReference> reference = secretOf(storedById.get(item.get(idField)), item);
			if (reference.isEmpty()) {
				return Optional.empty();
			}
			kept.put((String) item.get(idField), reference.get());
		}
		return Optional.of(kept);
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
		Set<SecretReference> kept = referencesOf(after);
		return referencesOf(before).stream().filter(reference -> !kept.contains(reference)).toList();
	}

	/** The secret of the stored item, when the item of the change has the same address; else empty. */
	private Optional<SecretReference> secretOf(Map<String, ?> stored, Map<String, ?> item) {
		if (stored == null || !Objects.equals(stored.get(addressField), item.get(addressField))) {
			return Optional.empty();
		}
		return SettingsService.referenceOf(stored.get(secretField));
	}

	private Set<SecretReference> referencesOf(List<? extends Map<String, ?>> items) {
		Set<SecretReference> references = new LinkedHashSet<>();
		if (secretField != null) {
			items.forEach(item -> SettingsService.referenceOf(item.get(secretField)).ifPresent(references::add));
		}
		return references;
	}

	private boolean hasValidFields(Map<?, ?> item) {
		if (!item.keySet().stream().allMatch(name -> fields.stream().anyMatch(field -> field.name().equals(name)))) {
			return false;
		}
		for (ItemField field : fields) {
			if (item.containsKey(field.name())) {
				if (!field.type().validate(item.get(field.name()), field.min(), field.max())) {
					return false;
				}
			}
			else if (isRequired(field)) {
				return false;
			}
		}
		return true;
	}

	/** An item needs its ID, and each field without a default; only the secret field can be missing without one. */
	private boolean isRequired(ItemField field) {
		return field.name().equals(idField) || (!field.name().equals(secretField) && field.defaultValue() == null);
	}

	private static boolean hasField(List<ItemField> fields, String name, SettingType type) {
		return fields.stream().anyMatch(field -> field.name().equals(name) && field.type() == type);
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

		/** @throws IllegalArgumentException when the type is {@link SettingType#LIST} */
		public ItemField {
			Objects.requireNonNull(name, "name");
			if (type == SettingType.LIST) {
				throw new IllegalArgumentException("A field of an item of a list setting cannot be a list.");
			}
		}

	}

}

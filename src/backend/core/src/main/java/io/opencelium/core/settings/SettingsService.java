package io.opencelium.core.settings;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Stream;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.bson.Document;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.settings.InvalidSettingsException.Problem;
import io.opencelium.core.settings.InvalidSettingsException.SettingError;
import io.opencelium.core.settings.SettingList.ItemField;

/**
 * Reads and changes the runtime settings. The only path of the code to the settings collection. It reads the database
 * at each call and keeps no copy, so a value that another core instance changes is visible at the next read.
 * <p>
 * A secret setting keeps a secret reference in the database, and the secret provider keeps the ciphertext. A read
 * shows {@value #MASK} for it, and no method of this class gives the plaintext. A list setting keeps a secret
 * reference in the secret field of each item, and a read shows {@value #MASK} there.
 */
final class SettingsService {

	/** The value that a read and a change show for a secret setting with a secret. */
	static final String MASK = "****";

	private static final Log log = LogFactory.getLog(SettingsService.class);

	/** The field of a stored secret reference with the owner of the secret. */
	private static final String OWNER = "owner";

	/** The field of a stored secret reference with the ID of the secret. */
	private static final String ID = "id";

	private final SettingRegistry registry;

	private final SettingsRepository repository;

	private final SecretProvider secrets;

	SettingsService(SettingRegistry registry, SettingsRepository repository, SecretProvider secrets) {
		this.registry = registry;
		this.repository = repository;
		this.secrets = secrets;
	}

	/** Each declared setting with its value: the database value, or the default when the database has none. */
	List<SettingValue> read() {
		Document values = repository.installationValues().orElseGet(Document::new);
		return registry.definitions().stream().map(definition -> valueOf(definition, values)).toList();
	}

	/**
	 * Changes the settings of the map in 1 update: a valid new value replaces the database value, and the value
	 * {@code null} or the default removes it. A map with 1 unknown setting key or 1 value that is not valid changes
	 * nothing.
	 * <p>
	 * A value is valid when it has the form of the type of the setting, then passes the rule of the feature, and, for a
	 * list, when each item without a secret keeps the secret of the stored item with the same ID and the same address.
	 * <p>
	 * A secret, and the secret of a list item, changes in 3 steps: the secret provider keeps the new secret, the update
	 * sets its reference and gives the replaced reference, and the secret provider deletes the replaced secret. When
	 * the update fails, the secret provider deletes the new secrets again. When the update is done but a replaced
	 * secret does not delete, the change stays: the log names the reference of the left-over ciphertext, which holds
	 * no plaintext.
	 *
	 * @param changes the setting keys and their new values; a value can be {@code null}
	 * @return each declared setting with its value after the change
	 * @throws InvalidSettingsException when a setting key is unknown or a value is not valid; it names each such key
	 */
	List<SettingValue> change(Map<String, Object> changes) {
		Map<String, Object> sorted = new TreeMap<>(changes);
		List<SettingError> errors = new ArrayList<>();
		Map<String, Object> values = new LinkedHashMap<>();
		Map<String, String> newSecrets = new LinkedHashMap<>();
		Map<String, ListChange> listChanges = new LinkedHashMap<>();
		List<String> resets = new ArrayList<>();
		sorted.forEach((key, value) -> {
			Optional<SettingDefinition> definition = registry.definition(key);
			if (definition.isEmpty()) {
				errors.add(new SettingError(key, Problem.UNKNOWN_KEY));
			}
			else if (value == null) {
				resets.add(key);
			}
			else if (!accepts(definition.get(), value)) {
				errors.add(new SettingError(key, Problem.INVALID_VALUE));
			}
			else if (definition.get().type() == SettingType.SECRET) {
				newSecrets.put(key, (String) value);
			}
			else if (databaseValue(definition.get().type(), value).equals(definition.get().defaultValue())) {
				resets.add(key);
			}
			else if (definition.get().type() == SettingType.LIST) {
				List<Map<String, Object>> items = itemsOf(value);
				definition.get().list().keptSecrets(storedItems(definition.get()), items).ifPresentOrElse(
						kept -> listChanges.put(key, new ListChange(items, kept)),
						() -> errors.add(new SettingError(key, Problem.INVALID_VALUE)));
			}
			else {
				values.put(key, databaseValue(definition.get().type(), value));
			}
		});
		if (!errors.isEmpty()) {
			throw new InvalidSettingsException(errors);
		}
		Document before = changeWithSecrets(values, newSecrets, listChanges, resets);
		deleteReplacedSecrets(before, values, resets);
		return read();
	}

	/**
	 * The type of the setting, then, for a list, the form of its items, then the rule of the feature. A rule runs only
	 * for a value that has the form of the type, so it needs no check of the form itself.
	 */
	private static boolean accepts(SettingDefinition definition, Object value) {
		return definition.type().validate(value, definition.min(), definition.max())
				&& (definition.type() != SettingType.LIST || definition.list().validate(value))
				&& (definition.rule() == null || definition.rule().validate(value));
	}

	/**
	 * Keeps the new secrets, sets them into {@code values} with the items of the changed lists, and updates the
	 * document.
	 *
	 * @param values the database values of the change without a secret; the method adds the secret references and the
	 *               items of the lists, so that it holds each new database value after the call
	 * @return the document as it was before the update, or {@code null} when there was none or nothing changed
	 */
	private Document changeWithSecrets(Map<String, Object> values, Map<String, String> newSecrets,
			Map<String, ListChange> listChanges, List<String> resets) {
		List<SecretReference> created = new ArrayList<>();
		try {
			newSecrets.forEach((key, secret) -> {
				SecretReference reference = keep(secret);
				created.add(reference);
				values.put(key, documentOf(reference));
			});
			listChanges.forEach((key, change) -> values.put(key,
					databaseItems(registry.definition(key).orElseThrow().list(), change, created)));
			return repository.change(values, resets).orElse(null);
		}
		catch (RuntimeException ex) {
			for (SecretReference reference : created) {
				try {
					secrets.delete(reference);
				}
				catch (RuntimeException deleteFailure) {
					ex.addSuppressed(deleteFailure);
				}
			}
			throw ex;
		}
	}

	/**
	 * The items as the database keeps them: each field that the item gives, and in the secret field a secret reference,
	 * the new one when the item gives a secret and the kept one else.
	 */
	private List<Document> databaseItems(SettingList list, ListChange change, List<SecretReference> created) {
		List<Document> items = new ArrayList<>();
		for (Map<String, Object> item : change.items()) {
			Document stored = new Document();
			for (ItemField field : list.fields()) {
				Object value = item.get(field.name());
				if (field.name().equals(list.secretField())) {
					SecretReference reference;
					if (value == null) {
						reference = change.kept().get((String) item.get(list.idField()));
					}
					else {
						reference = keep((String) value);
						created.add(reference);
					}
					stored.append(field.name(), documentOf(reference));
				}
				else if (value != null) {
					stored.append(field.name(), databaseValue(field.type(), value));
				}
			}
			items.add(stored);
		}
		return items;
	}

	/** A secret of an installation setting belongs to the installation, with the owner {@code system}. */
	private SecretReference keep(String secret) {
		byte[] plaintext = secret.getBytes(StandardCharsets.UTF_8);
		try {
			return secrets.store(TenantId.SYSTEM, plaintext);
		}
		finally {
			Arrays.fill(plaintext, (byte) 0);
		}
	}

	/**
	 * Deletes each secret whose reference the update replaced or removed: the secret of a secret setting that got a new
	 * value or a reset, and the secret of each list item that the update removed or gave a new secret.
	 *
	 * @param before the document as it was before the update, or {@code null} when it had no value
	 * @param after  the database value of each setting that the update set
	 * @param resets the setting keys that the update removed
	 */
	private void deleteReplacedSecrets(Document before, Map<String, Object> after, List<String> resets) {
		if (before == null) {
			return;
		}
		for (String key : Stream.concat(after.keySet().stream(), resets.stream()).toList()) {
			SettingDefinition definition = registry.definition(key).orElseThrow();
			for (SecretReference replaced : replacedSecrets(definition, before.getEmbedded(path(key), Object.class),
					after.get(key))) {
				try {
					secrets.delete(replaced);
				}
				catch (RuntimeException ex) {
					log.warn("The change of " + key + " is done, but the replaced secret " + replaced
							+ " did not delete; its ciphertext stays without a reference.", ex);
				}
			}
		}
	}

	/** The secrets of the stored value that the new value of the setting does not hold; {@code null} is a reset. */
	private static List<SecretReference> replacedSecrets(SettingDefinition definition, Object before, Object after) {
		return switch (definition.type()) {
			case SECRET -> referenceOf(before).stream().toList();
			case LIST -> definition.list().removedSecrets(documentsIn(before), documentsIn(after));
			case TEXT, INTEGER, HOST, BOOLEAN -> List.of();
		};
	}

	/**
	 * The secret reference of a stored secret, or empty when the value is not the form of a stored secret. A stored
	 * reference with an owner that is not a tenant ID is not a secret that core can delete or send, so it also gives
	 * empty.
	 */
	static Optional<SecretReference> referenceOf(Object stored) {
		if (stored instanceof Map<?, ?> reference && reference.get(OWNER) instanceof String owner
				&& reference.get(ID) instanceof String id) {
			try {
				return Optional.of(new SecretReference(TenantId.of(owner), id));
			}
			catch (IllegalArgumentException ex) {
				return Optional.empty();
			}
		}
		return Optional.empty();
	}

	/** The form of a secret reference in the database: the subdocument of a secret setting and of a secret field. */
	private static Document documentOf(SecretReference reference) {
		return new Document(OWNER, reference.owner().value()).append(ID, reference.id());
	}

	/** The path of the field of a setting key in the document: {@code broker.port} is {@code [broker, port]}. */
	private static List<String> path(String key) {
		return Arrays.asList(key.split("\\."));
	}

	/**
	 * The value as the database keeps it: an integer always as a 32-bit number, also when the JSON parser gave a
	 * long.
	 */
	private static Object databaseValue(SettingType type, Object valid) {
		return type == SettingType.INTEGER ? Integer.valueOf(((Number) valid).intValue()) : valid;
	}

	/** The items of a list value that the form of the list accepted: each item as a map of its fields. */
	private static List<Map<String, Object>> itemsOf(Object valid) {
		List<Map<String, Object>> items = new ArrayList<>();
		for (Object item : (List<?>) valid) {
			Map<String, Object> fields = new LinkedHashMap<>();
			((Map<?, ?>) item).forEach((name, value) -> fields.put((String) name, value));
			items.add(fields);
		}
		return items;
	}

	/** The items of the list of the setting in the database; empty when it has none. */
	private List<Map<String, ?>> storedItems(SettingDefinition definition) {
		Document values = repository.installationValues().orElseGet(Document::new);
		return documentsIn(values.getEmbedded(path(definition.key()), Object.class));
	}

	/** The subdocuments of a stored list; {@code null}, for a reset, gives an empty list. */
	private static List<Map<String, ?>> documentsIn(Object stored) {
		List<Map<String, ?>> items = new ArrayList<>();
		if (stored instanceof List<?> list) {
			list.stream().filter(Document.class::isInstance).map(Document.class::cast).forEach(items::add);
		}
		return items;
	}

	/**
	 * A secret setting with a secret shows the mask, a list setting its items with the mask in place of each secret,
	 * never a reference and never a plaintext.
	 */
	private static SettingValue valueOf(SettingDefinition definition, Document values) {
		Object stored = values.getEmbedded(path(definition.key()), Object.class);
		if (stored == null) {
			return new SettingValue(definition.key(), definition.defaultValue(), true);
		}
		Object shown = switch (definition.type()) {
			case SECRET -> MASK;
			case LIST -> definition.list().masked(documentsIn(stored));
			case TEXT, INTEGER, HOST, BOOLEAN -> stored;
		};
		return new SettingValue(definition.key(), shown, false);
	}

	/**
	 * A valid change of a list setting.
	 *
	 * @param items the items of the change, as the JSON parser gave them
	 * @param kept  the stored secret of each item of the change without a secret, by the ID of the item
	 */
	private record ListChange(List<Map<String, Object>> items, Map<String, SecretReference> kept) {

	}

	/**
	 * @param key       the setting key
	 * @param value     the value; {@code null} when the setting has no value
	 * @param isDefault {@code true} when the value is the default, because the database has no value for the setting
	 */
	record SettingValue(String key, Object value, boolean isDefault) {

	}

}

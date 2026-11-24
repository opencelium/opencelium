package io.opencelium.core.settings;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.bson.Document;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.settings.InvalidSettingsException.Problem;
import io.opencelium.core.settings.InvalidSettingsException.SettingError;

/**
 * Reads and changes the runtime settings. The only path of the code to the settings collection. It reads the database
 * at each call and keeps no copy, so a value that another core instance changes is visible at the next read.
 * <p>
 * A secret setting keeps a secret reference in the database, and the secret provider keeps the ciphertext. A read
 * shows {@value #MASK} for it, and no method of this class gives the plaintext.
 */
final class SettingsService {

	/** The value that a read and a change show for a secret setting with a secret. */
	static final String MASK = "****";

	private static final Log log = LogFactory.getLog(SettingsService.class);

	private static final String OWNER = "owner";

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
	 * A secret setting changes in 3 steps: the secret provider keeps the new secret, the update sets its reference and
	 * gives the replaced reference, and the secret provider deletes the replaced secret. When the update fails, the
	 * secret provider deletes the new secrets again. When the update is done but a replaced secret does not delete,
	 * the change stays: the log names the reference of the left-over ciphertext, which holds no plaintext.
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
		List<String> resets = new ArrayList<>();
		sorted.forEach((key, value) -> {
			Optional<SettingDefinition> definition = registry.definition(key);
			if (definition.isEmpty()) {
				errors.add(new SettingError(key, Problem.UNKNOWN_KEY));
			}
			else if (value == null) {
				resets.add(key);
			}
			else if (!definition.get().type().validate(value, definition.get().min(), definition.get().max())) {
				errors.add(new SettingError(key, Problem.INVALID_VALUE));
			}
			else if (definition.get().type() == SettingType.SECRET) {
				newSecrets.put(key, (String) value);
			}
			else if (databaseValue(definition.get(), value).equals(definition.get().defaultValue())) {
				resets.add(key);
			}
			else {
				values.put(key, databaseValue(definition.get(), value));
			}
		});
		if (!errors.isEmpty()) {
			throw new InvalidSettingsException(errors);
		}
		Document before = changeWithSecrets(values, newSecrets, resets);
		deleteReplacedSecrets(before, newSecrets.keySet(), resets);
		return read();
	}

	private Document changeWithSecrets(Map<String, Object> values, Map<String, String> newSecrets,
			List<String> resets) {
		List<SecretReference> kept = new ArrayList<>();
		try {
			newSecrets.forEach((key, secret) -> {
				SecretReference reference = keep(secret);
				kept.add(reference);
				values.put(key, new Document(OWNER, reference.owner().value()).append(ID, reference.id()));
			});
			return repository.change(values, resets).orElse(null);
		}
		catch (RuntimeException ex) {
			for (SecretReference reference : kept) {
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

	/** Deletes each secret whose reference the update replaced or removed. */
	private void deleteReplacedSecrets(Document before, Collection<String> changedSecrets, List<String> resets) {
		if (before == null) {
			return;
		}
		List<String> keys = new ArrayList<>(changedSecrets);
		for (String key : resets) {
			if (registry.definition(key).filter(definition -> definition.type() == SettingType.SECRET).isPresent()) {
				keys.add(key);
			}
		}
		for (String key : keys) {
			if (before.getEmbedded(path(key), Object.class) instanceof Document stored) {
				var replaced = new SecretReference(TenantId.of(stored.getString(OWNER)), stored.getString(ID));
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

	/** The path of the field of a setting key in the document: {@code broker.port} is {@code [broker, port]}. */
	private static List<String> path(String key) {
		return Arrays.asList(key.split("\\."));
	}

	/**
	 * The value as the database keeps it: an integer always as a 32-bit number, also when the JSON parser gave a
	 * long.
	 */
	private static Object databaseValue(SettingDefinition definition, Object valid) {
		return definition.type() == SettingType.INTEGER ? Integer.valueOf(((Number) valid).intValue()) : valid;
	}

	/** A secret setting with a secret shows the mask, never its reference and never its plaintext. */
	private static SettingValue valueOf(SettingDefinition definition, Document values) {
		Object stored = values.getEmbedded(path(definition.key()), Object.class);
		if (stored == null) {
			return new SettingValue(definition.key(), definition.defaultValue(), true);
		}
		return new SettingValue(definition.key(), definition.type() == SettingType.SECRET ? MASK : stored, false);
	}

	/**
	 * @param key       the setting key
	 * @param value     the value; {@code null} when the setting has no value
	 * @param isDefault {@code true} when the value is the default, because the database has no value for the setting
	 */
	record SettingValue(String key, Object value, boolean isDefault) {

	}

}

package io.opencelium.core.settings;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import io.opencelium.core.authz.InstallationAdminOnly;
import io.opencelium.core.settings.SettingsService.SettingValue;

/**
 * The settings API of the installation. A read and a change give 1 field for each setting key, with the value and a
 * mark that tells if the value is the default. A change is 1 JSON object of setting keys and new values; the value
 * {@code null} resets a setting to its default. Each endpoint of the class needs the permission rule of the
 * installation admin, so an endpoint that a later change adds is not open to other users by mistake.
 * <p>
 * A change reads its body itself, and not as a request body of Spring MVC: Spring MVC reads such a body before the
 * method security examines the rule. Thus a user without the permission gets 403 before core reads a byte of the
 * body, and core reads at most {@value #MAX_BODY_BYTES} bytes of it.
 * <p>
 * The class and its endpoint methods are not final: the method security of Spring Security wraps the controller in
 * a proxy that examines the rule before a method runs.
 */
@RestController
@InstallationAdminOnly
class SettingsController {

	static final String PATH = "/api/settings";

	/** The media type of a JSON merge patch, which a change also accepts. */
	static final String MERGE_PATCH_JSON = "application/merge-patch+json";

	/** The largest body of a change; a change of all settings with values of the longest form is far smaller. */
	static final int MAX_BODY_BYTES = 64 * 1024;

	private static final TypeReference<Map<String, Object>> CHANGES = new TypeReference<>() {
	};

	private final SettingsService settings;

	private final JsonMapper jsonMapper;

	SettingsController(SettingsService settings, JsonMapper jsonMapper) {
		this.settings = settings;
		this.jsonMapper = jsonMapper;
	}

	@GetMapping(PATH)
	public ResponseEntity<Map<String, SettingField>> read() {
		return ResponseEntity.ok(fieldsOf(settings.read()));
	}

	/**
	 * @param body the body of the request, which the method reads only after the method security passed the rule
	 * @throws InvalidSettingsException   when a setting key is unknown or a value is not valid; nothing changes
	 * @throws UnreadableChangeException when the body is not 1 JSON object or is too long; nothing changes
	 */
	@PatchMapping(path = PATH, consumes = { MediaType.APPLICATION_JSON_VALUE, MERGE_PATCH_JSON })
	public ResponseEntity<Map<String, SettingField>> change(InputStream body) throws IOException {
		return ResponseEntity.ok(fieldsOf(settings.change(changesOf(body))));
	}

	@ExceptionHandler(InvalidSettingsException.class)
	ResponseEntity<ProblemDetail> invalidSettings(InvalidSettingsException refused) {
		ProblemDetail problem = SettingsError.INVALID_SETTINGS.problem();
		problem.setProperty(SettingsError.ERRORS_FIELD, refused.errors().stream()
				.map(error -> new ErrorField(error.key(), error.problem().code())).toList());
		return ResponseEntity.badRequest().body(problem);
	}

	@ExceptionHandler(UnreadableChangeException.class)
	ResponseEntity<ProblemDetail> badRequest() {
		return ResponseEntity.badRequest().body(SettingsError.BAD_REQUEST.problem());
	}

	/**
	 * The map of a change: 1 JSON object of at most {@value #MAX_BODY_BYTES} bytes. The bytes of the body are zeroed
	 * after the parse, because a value of a change can be a credential.
	 */
	private Map<String, Object> changesOf(InputStream body) throws IOException {
		byte[] json = body.readNBytes(MAX_BODY_BYTES + 1);
		try {
			if (json.length > MAX_BODY_BYTES) {
				throw new UnreadableChangeException();
			}
			Map<String, Object> changes = jsonMapper.readValue(json, CHANGES);
			if (changes == null) {
				throw new UnreadableChangeException();
			}
			return changes;
		}
		catch (JacksonException ex) {
			throw new UnreadableChangeException();
		}
		finally {
			Arrays.fill(json, (byte) 0);
		}
	}

	private static Map<String, SettingField> fieldsOf(List<SettingValue> values) {
		Map<String, SettingField> fields = new LinkedHashMap<>();
		for (SettingValue setting : values) {
			fields.put(setting.key(), new SettingField(setting.value(), setting.isDefault()));
		}
		return fields;
	}

	/**
	 * @param value     the value; {@code null} when the setting has no value
	 * @param isDefault {@code true} when the database has no value for the setting, so the default applies
	 */
	record SettingField(Object value, @JsonProperty("default") boolean isDefault) {

	}

	/**
	 * A body of a change that is not JSON, that is JSON but not 1 object (for example an array), or that is longer
	 * than {@value #MAX_BODY_BYTES} bytes. The message names no part of the body.
	 */
	static final class UnreadableChangeException extends RuntimeException {

		UnreadableChangeException() {
			super("The body of the change of the settings is not 1 JSON object of at most " + MAX_BODY_BYTES
					+ " bytes.");
		}

	}

	/**
	 * @param key     an incorrect setting key of the change
	 * @param problem {@code unknown-key} or {@code invalid-value}
	 */
	record ErrorField(String key, String problem) {

	}

}

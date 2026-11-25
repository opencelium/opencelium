package io.opencelium.core.settings;

import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.opencelium.core.authz.InstallationAdminOnly;
import io.opencelium.core.settings.SettingsService.SettingValue;

/**
 * The settings API of the installation. The response has 1 field for each setting key, with the value and a mark
 * that tells if the value is the default. Each endpoint of the class needs the permission rule of the installation
 * admin, so an endpoint that a later change adds is not open to other users by mistake.
 * <p>
 * The class and its endpoint methods are not final: the method security of Spring Security wraps the controller in
 * a proxy that examines the rule before a method runs.
 */
@RestController
@InstallationAdminOnly
class SettingsController {

	static final String PATH = "/api/settings";

	private final SettingsService settings;

	SettingsController(SettingsService settings) {
		this.settings = settings;
	}

	@GetMapping(PATH)
	public ResponseEntity<Map<String, SettingField>> read() {
		Map<String, SettingField> fields = new LinkedHashMap<>();
		for (SettingValue setting : settings.read()) {
			fields.put(setting.key(), new SettingField(setting.value(), setting.isDefault()));
		}
		return ResponseEntity.ok(fields);
	}

	/**
	 * @param value     the value; {@code null} when the setting has no value
	 * @param isDefault {@code true} when the database has no value for the setting, so the default applies
	 */
	record SettingField(Object value, @JsonProperty("default") boolean isDefault) {

	}

}

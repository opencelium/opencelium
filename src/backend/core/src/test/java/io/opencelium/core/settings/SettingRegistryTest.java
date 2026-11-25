package io.opencelium.core.settings;

import java.util.List;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The registry gives each declared setting by its setting key, and a setting key that 2 definitions declare stops
 * the start.
 */
class SettingRegistryTest {

	private static final SettingDefinition PORT = new SettingDefinition("broker.port", SettingType.INTEGER, 5672, 1,
			65535);

	private static final SettingDefinition HOST = new SettingDefinition("broker.host", SettingType.HOST, null, 1, 253);

	@Test
	void constructorStopsWithTheSettingKeyWhenTwoDefinitionsDeclareIt() {
		var secondPort = new SettingDefinition("broker.port", SettingType.TEXT, "5672", 1, 255);

		assertThatThrownBy(() -> new SettingRegistry(List.of(PORT, HOST, secondPort)))
				.isInstanceOf(IllegalStateException.class).hasMessageContaining("broker.port");
	}

	@Test
	void definitionGivesTheDefinitionWhenTheSettingKeyIsKnown() {
		var registry = new SettingRegistry(List.of(PORT, HOST));

		assertThat(registry.definition("broker.port")).contains(PORT);
	}

	@Test
	void definitionsGivesEachDeclaredSettingWhenTheRegistryHasDefinitions() {
		var registry = new SettingRegistry(List.of(PORT, HOST));

		assertThat(registry.definitions()).containsExactlyInAnyOrder(HOST, PORT);
	}

	@Test
	void definitionIsEmptyWhenNoFeatureDeclaresTheSettingKey() {
		var registry = new SettingRegistry(List.of(PORT, HOST));

		assertThat(registry.definition("broker.vhost")).isEmpty();
	}

}

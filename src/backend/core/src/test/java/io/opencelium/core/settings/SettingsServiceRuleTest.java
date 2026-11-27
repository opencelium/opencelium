package io.opencelium.core.settings;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.core.settings.InvalidSettingsException.Problem;
import io.opencelium.core.settings.InvalidSettingsException.SettingError;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.Mockito.mock;

/**
 * The problem that a rule of a feature gives for a value reaches the error response only as a problem code: lower-case
 * letters a to z and hyphens. Each other text of a rule, for example an address from the value of the change, gives
 * the problem {@code invalid-value}, so that no text of a rule reaches the response. The error names each incorrect
 * setting key, also a key that only the rule of its feature refuses.
 */
class SettingsServiceRuleTest {

	private static final String KEY = "remote.address";

	/** A setting without a rule: a port from 1 to 65535. */
	private static final SettingDefinition PORT = new SettingDefinition("remote.port", SettingType.INTEGER, null, 1,
			65535);

	private final SettingsRepository repository = mock(SettingsRepository.class);

	@ParameterizedTest(name = "\"{0}\"")
	@ValueSource(strings = { "https://x.example.com", "No-Discovery-Document", "no_discovery_document", "error-404",
			"no discovery document", "" })
	void changeGivesInvalidValueWhenTheProblemOfTheRuleIsNotAProblemCode(String problem) {
		SettingsService settings = withRuleThatRefusesWith(problem);

		InvalidSettingsException refused = catchThrowableOfType(InvalidSettingsException.class,
				() -> settings.change(Map.of(KEY, "https://x.example.com/realms/oc")));

		assertThat(refused).as("the refusal of the change").isNotNull();
		assertThat(refused.errors()).containsExactly(new SettingError(KEY, Problem.INVALID_VALUE));
	}

	@Test
	void changeNamesEachIncorrectKeyWhenOneKeyHasNoFormAndTheRuleOfAnotherRefusesIt() {
		SettingsService settings = withRuleThatRefusesWith("no-discovery-document");

		InvalidSettingsException refused = catchThrowableOfType(InvalidSettingsException.class,
				() -> settings.change(Map.of(KEY, "https://x.example.com/realms/oc", PORT.key(), 0)));

		assertThat(refused).as("the refusal of the change").isNotNull();
		assertThat(refused.errors()).containsExactly(new SettingError(KEY, "no-discovery-document"),
				new SettingError(PORT.key(), Problem.INVALID_VALUE));
	}

	/**
	 * The settings service with 1 text setting whose rule accepts each value in {@link SettingRule#validate} and
	 * refuses it with the problem, and 1 port setting without a rule.
	 */
	private SettingsService withRuleThatRefusesWith(String problem) {
		SettingRule rule = new SettingRule() {

			@Override
			public boolean validate(Object value) {
				return true;
			}

			@Override
			public Optional<String> problemOf(Object value, Object stored) {
				return Optional.of(problem);
			}

		};
		var definition = new SettingDefinition(KEY, SettingType.TEXT, null, 1, 200, null, rule);
		return new SettingsService(new SettingRegistry(List.of(definition, PORT)), repository,
				mock(SecretProvider.class));
	}

}

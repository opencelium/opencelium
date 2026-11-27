package io.opencelium.core.settings;

import java.util.Optional;

/**
 * A rule of a feature for the value of 1 of its settings, beyond the type and the bounds of the setting definition.
 * The settings service applies {@link #problemOf} to a value of a change before it changes the settings document, so
 * a value that the rule refuses changes nothing.
 * <p>
 * {@link #validate} is the yes-or-no form of the rule: it is the only method that a rule must implement, and the
 * default of {@link #problemOf} turns a {@code false} into the problem {@code invalid-value}. A rule that has a reason
 * of its own for a refusal, for example because it examines another system, overrides {@link #problemOf} too. The
 * settings service never calls {@link #validate} itself.
 */
@FunctionalInterface
public interface SettingRule {

	/**
	 * @param value a value of a change that has the form of the type of the setting, never {@code null}; for a list,
	 *              the items of the change as JSON objects, an item without a secret has no secret field
	 * @return {@code true} when the feature accepts the value
	 */
	boolean validate(Object value);

	/**
	 * The problem of a value of a change, for the error response of the change: the settings package knows no
	 * feature, so a feature that refuses a value for a reason of its own names that reason itself. The stored value
	 * lets a rule examine only the parts of the value that the change makes new.
	 * <p>
	 * The problem is a code of lower-case letters a to z and hyphens, for example {@code no-discovery-document}. The
	 * settings service puts another text, also an empty one, into the response as {@code invalid-value}, so that no
	 * text of a rule, which can hold a part of the value, reaches the response.
	 * <p>
	 * The default accepts the value when {@link #validate} does, and else gives {@code invalid-value}.
	 *
	 * @param value  a value of a change, as for {@link #validate}
	 * @param stored the database value of the setting before the change, or {@code null} when the database has none;
	 *               for a list, the items as the database keeps them, with the secret reference of each item and
	 *               never a plaintext
	 * @return empty when the feature accepts the value; else the problem of the setting key in the error response,
	 *         {@code invalid-value} or a problem of the feature
	 */
	default Optional<String> problemOf(Object value, Object stored) {
		return validate(value) ? Optional.empty() : Optional.of(InvalidSettingsException.Problem.INVALID_VALUE.code());
	}

}

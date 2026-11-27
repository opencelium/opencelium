package io.opencelium.core.settings;

import java.util.Optional;

/**
 * A rule of a feature for the value of 1 of its settings, beyond the type and the bounds of the setting definition.
 * The settings service applies it to a value of a change before it changes the settings document, so a value that the
 * rule refuses changes nothing and gives the problem {@code invalid-value}.
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
	 *
	 * @param value  a value of a change, as for {@link #validate}
	 * @param stored the database value of the setting before the change, or {@code null} when the database has none;
	 *               for a list, the items as the database keeps them, with the secret reference of each item and
	 *               never a plaintext
	 * @return empty when the feature accepts the value; else the problem of the setting key in the error response,
	 *         {@code invalid-value} or a problem of the feature
	 */
	default Optional<String> problemOf(Object value, Object stored) {
		throw new UnsupportedOperationException("The problem of a value of a change is not implemented yet.");
	}

}

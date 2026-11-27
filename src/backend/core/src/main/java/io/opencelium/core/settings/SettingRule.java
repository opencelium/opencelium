package io.opencelium.core.settings;

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

}

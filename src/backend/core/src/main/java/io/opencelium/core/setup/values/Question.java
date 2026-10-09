package io.opencelium.core.setup.values;

import java.util.Objects;

/**
 * One question of the wizard, declared once by its step: the key in the setup file, the label on the screen, the
 * help text, and the default of this host. The prompt, the setup file template and the messages all read it, so
 * the three never disagree.
 *
 * @param defaultValue the default as the user would type it, for example {@code ~/oc/data} or {@code 9090}
 */
public record Question(ValueKey key, String label, String help, String defaultValue) {

	public Question {
		Objects.requireNonNull(key, "key");
		Objects.requireNonNull(label, "label");
		Objects.requireNonNull(help, "help");
		Objects.requireNonNull(defaultValue, "defaultValue");
	}

}

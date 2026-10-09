package io.opencelium.core.setup;

import java.util.Arrays;
import java.util.Optional;

/**
 * A bare word on the command line of {@code java -jar oc-app.jar} that selects what runs instead of the normal
 * start. Any other bare word is a usage error, so a mistyped command never starts the application by accident.
 */
public enum Subcommand {

	/** Runs the setup wizard, also when a configuration already exists. */
	SETUP("setup");

	private final String word;

	Subcommand(String word) {
		this.word = word;
	}

	/** The word as typed on the command line. */
	public String word() {
		return word;
	}

	static Optional<Subcommand> parse(String word) {
		return Arrays.stream(values()).filter(command -> command.word.equals(word)).findFirst();
	}

}

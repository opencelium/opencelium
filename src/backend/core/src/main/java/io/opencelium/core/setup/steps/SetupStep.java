package io.opencelium.core.setup.steps;

import java.util.Optional;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.Question;

/**
 * One screen of the wizard. A step asks its questions through the prompter and stores the answers in the context;
 * it never writes a file. The wizard runs the steps in order and skips a step that does not apply to the answers
 * so far, for example a step that only cloud mode needs.
 */
@FunctionalInterface
public interface SetupStep {

	default boolean applicable(SetupContext context) {
		return true;
	}

	/** The question this step asks, for the setup file template; empty for a step that asks none. */
	default Optional<Question> question() {
		return Optional.empty();
	}

	/**
	 * @throws io.opencelium.core.setup.SetupCancelledException when the user cancels at one of the questions
	 */
	void run(SetupContext context, Prompter prompter);

}

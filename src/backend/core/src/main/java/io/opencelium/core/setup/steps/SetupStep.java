package io.opencelium.core.setup.steps;

import java.util.List;

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

	/** The questions this step asks, in order, for the setup file template; empty for a step that asks none. */
	default List<Question> questions() {
		return List.of();
	}

	/**
	 * @throws io.opencelium.core.setup.SetupCancelledException when the user cancels at one of the questions
	 */
	void run(SetupContext context, Prompter prompter);

}

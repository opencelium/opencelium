package io.opencelium.core.testsupport.fake;

import java.util.Objects;
import java.util.function.BiConsumer;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.steps.SetupStep;

/**
 * A setup step with a fixed name whose run is a lambda of the test, so a test of the wizard loop needs no class for
 * each step. It asks no question for the setup file template and always applies.
 */
public record NamedStep(String name, BiConsumer<SetupContext, Prompter> body) implements SetupStep {

	public NamedStep {
		Objects.requireNonNull(name, "name");
		Objects.requireNonNull(body, "body");
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		body.accept(context, prompter);
	}

}

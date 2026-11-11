package io.opencelium.core.setup.steps;

import java.util.function.Predicate;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * The first admin: the step asks the admin username and plans the admin marker, which the start turns into the admin
 * with the admin password {@code 1234}. When the database holds an admin already, the step does not apply.
 */
public final class AdminStep implements SetupStep {

	public AdminStep() {
		throw new UnsupportedOperationException();
	}

	/**
	 * @param adminExists whether the database of a connection holds an admin of the self-host tenant
	 */
	public AdminStep(Predicate<MongoConnection> adminExists) {
	}

	@Override
	public String name() {
		throw new UnsupportedOperationException();
	}

	@Override
	public boolean applicable(SetupContext context) {
		throw new UnsupportedOperationException();
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		throw new UnsupportedOperationException();
	}

}

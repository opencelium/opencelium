package io.opencelium.core.setup.steps;

import java.util.List;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.Choice;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * The first question: how this OpenCelium is operated. Self-host is the default, as it is at a start without a file.
 */
public final class ModeStep implements SetupStep {

	private static final List<DeploymentMode> MODES = List.of(DeploymentMode.SELF_HOST, DeploymentMode.CLOUD);

	private static final List<Choice> OPTIONS = List.of(
			new Choice("Self-host", "one company, one database on this machine or nearby",
					"One installation for one company. OpenCelium keeps its data in one MongoDB database, on this\n"
							+ "machine or on a server nearby. This is the normal choice."),
			new Choice("Cloud", "multi-tenant platform behind the Service Portal (operators only)",
					"The multi-tenant platform that is operated behind the Service Portal. The configuration names\n"
							+ "only the system database, and every node needs the same master key from the operator."));

	@Override
	public void run(SetupContext context, Prompter prompter) {
		int chosen = prompter.choice("How will this OpenCelium run?", OPTIONS, MODES.indexOf(DeploymentMode.DEFAULT));
		context.setDeploymentMode(MODES.get(chosen));
	}

}

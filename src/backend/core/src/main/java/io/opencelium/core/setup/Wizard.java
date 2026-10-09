package io.opencelium.core.setup;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.steps.ModeStep;
import io.opencelium.core.setup.steps.SetupStep;

/**
 * The interactive setup: the banner, then the steps in order, each one skipped when it does not apply. A cancel at
 * any question ends the run with "nothing written" and exit code 0. Everything goes through the prompter, never
 * through a logger: before Spring starts the log system is not configured, and a password must never reach a log.
 */
public final class Wizard {

	private final Prompter prompter;

	private final List<SetupStep> steps;

	private final Optional<String> version;

	/**
	 * @param version the product version for the banner; empty when unknown
	 */
	public Wizard(Prompter prompter, List<SetupStep> steps, Optional<String> version) {
		this.prompter = Objects.requireNonNull(prompter, "prompter");
		this.steps = List.copyOf(steps);
		this.version = Objects.requireNonNull(version, "version");
	}

	/** The steps of a full setup, in the order the user sees them. */
	public static List<SetupStep> standardSteps() {
		return List.of(new ModeStep());
	}

	/** The version from the jar manifest; empty when the classes run unpacked, for example from the build tool. */
	public static Optional<String> versionFromManifest() {
		return Optional.ofNullable(Wizard.class.getPackage().getImplementationVersion());
	}

	/**
	 * @param reason why the wizard runs, in the words of the launch decision; the banner starts with it
	 * @return the exit code: 0 after the steps, and 0 after a cancel
	 */
	public int run(String reason) {
		printBanner(reason);
		SetupContext context = new SetupContext();
		try {
			for (SetupStep step : steps) {
				if (step.applicable(context)) {
					step.run(context, prompter);
				}
			}
		}
		catch (SetupCancelledException ex) {
			prompter.print("");
			prompter.print(ex.getMessage());
			return 0;
		}
		// Until the next steps exist: show what was answered, so the run has a visible result.
		context.deploymentMode().ifPresent(mode -> {
			prompter.print("");
			prompter.print("Mode: " + mode.propertyValue() + ". The other questions come in the next change.");
		});
		return 0;
	}

	private void printBanner(String reason) {
		prompter.print("");
		prompter.print("  OpenCelium" + version.map(v -> " " + v).orElse("") + " · setup");
		prompter.print("");
		prompter.print("  " + sentence(reason) + " I will ask a few questions, install what is missing, and write");
		prompter.print("  application.yml. Everything else is configured in the browser afterwards.");
		prompter.print("  Press Enter to accept the value in [brackets]. Type ? for help, q to quit.");
	}

	private static String sentence(String reason) {
		return Character.toUpperCase(reason.charAt(0)) + reason.substring(1) + ".";
	}

}

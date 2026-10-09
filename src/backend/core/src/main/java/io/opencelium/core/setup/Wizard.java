package io.opencelium.core.setup;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.OptionalInt;

import io.opencelium.core.setup.files.FilePlan;
import io.opencelium.core.setup.files.FilePlanWriter;
import io.opencelium.core.setup.files.SetupWriteException;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.steps.DataDirStep;
import io.opencelium.core.setup.steps.PortStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.setup.steps.SummaryStep;

/**
 * The interactive setup: the banner, then the steps in order, each one skipped when it does not apply, then the
 * write of the files the steps planned, then the start of the application. A cancel at any question ends the run
 * with "nothing written" and exit code 0; a write failure ends it with exit code 1 and starts nothing. Everything
 * goes through the prompter, never through a logger: before Spring starts the log system is not configured, and a
 * password must never reach a log.
 */
public final class Wizard {

	private static final String INDENT = "  ";

	private final Prompter prompter;

	private final List<SetupStep> steps;

	private final Runnable start;

	private final Optional<String> version;

	private volatile boolean written;

	/**
	 * @param start   starts the application once the files are written
	 * @param version the product version for the banner; empty when unknown
	 */
	public Wizard(Prompter prompter, List<SetupStep> steps, Runnable start, Optional<String> version) {
		this.prompter = Objects.requireNonNull(prompter, "prompter");
		this.steps = List.copyOf(steps);
		this.start = Objects.requireNonNull(start, "start");
		this.version = Objects.requireNonNull(version, "version");
	}

	/** The steps of a full setup, in the order the user sees them; the summary writes to {@code locations}. */
	public static List<SetupStep> standardSteps(ConfigLocations locations) {
		return List.of(new DataDirStep(), new PortStep(), new SummaryStep(locations));
	}

	/** The version from the jar manifest; empty when the classes run unpacked, for example from the build tool. */
	public static Optional<String> versionFromManifest() {
		return Optional.ofNullable(Wizard.class.getPackage().getImplementationVersion());
	}

	/**
	 * @param reason why the wizard runs, in the words of the launch decision; the banner starts with it
	 * @return the exit code when the process must end: 0 after a cancel, and when no step planned a file; 1 after a
	 * write failure. Empty when the application started.
	 */
	public OptionalInt run(String reason) {
		written = false;
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
			return OptionalInt.of(0);
		}
		FilePlan plan = context.filePlan();
		if (plan.isEmpty()) {
			return OptionalInt.of(0);
		}
		try {
			new FilePlanWriter(line -> prompter.print(INDENT + line)).write(plan);
		}
		catch (SetupWriteException ex) {
			prompter.print("");
			prompter.print(INDENT + ex.getMessage());
			prompter.print(INDENT + ex.rollbackReport());
			return OptionalInt.of(SetupFailedException.FAILURE_EXIT_CODE);
		}
		written = true;
		prompter.print("");
		prompter.print(INDENT + "Configuration written to " + plan.files().getFirst().path().getParent()
				+ ". OpenCelium starts now.");
		prompter.print("");
		start.run();
		return OptionalInt.empty();
	}

	/**
	 * Whether the current or last run wrote its files. From then on a Ctrl+C ends the application that is starting,
	 * not the setup, so "nothing was written" would be wrong.
	 */
	public boolean hasWritten() {
		return written;
	}

	private void printBanner(String reason) {
		prompter.print("");
		prompter.print(INDENT + "OpenCelium" + version.map(v -> " " + v).orElse("") + " · setup");
		prompter.print("");
		prompter.print(INDENT + sentence(reason) + " I will ask a few questions, install what is missing, and write");
		prompter.print(INDENT + "application.yml. Everything else is configured in the browser afterwards.");
		prompter.print(INDENT + "Press Enter to accept the value in [brackets]. Type ? for help, q to quit.");
		prompter.print("");
	}

	private static String sentence(String reason) {
		return Character.toUpperCase(reason.charAt(0)) + reason.substring(1) + ".";
	}

}

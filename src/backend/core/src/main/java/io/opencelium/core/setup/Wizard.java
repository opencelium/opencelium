package io.opencelium.core.setup;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.OptionalInt;

import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.setup.files.FilePlan;
import io.opencelium.core.setup.files.FilePlanWriter;
import io.opencelium.core.setup.files.SetupWriteException;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.steps.DataDirStep;
import io.opencelium.core.setup.steps.PortStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.setup.steps.SummaryStep;

/**
 * The setup: the banner, then the steps in order, each one skipped when it does not apply, then the write of the
 * files the steps planned, then the start of the application. The steps take their values from the value source:
 * the setup file, else the prompter. A cancel at any question ends the run with "nothing written" and exit code
 * 0. A missing or bad value in batch mode, and a write failure, end it with a {@link SetupFailedException}
 * that the launcher prints on standard error, and start nothing. The dialogue goes through the prompter, never
 * through a logger: before Spring starts the log system is not configured, and a password must never reach a log.
 */
public final class Wizard {

	private final Prompter prompter;

	private final ValueSource values;

	private final List<SetupStep> steps;

	private final Runnable start;

	private final Optional<String> version;

	private volatile boolean written;

	/**
	 * @param values  where the steps get their values
	 * @param start   starts the application once the files are written
	 * @param version the product version for the banner; empty when unknown
	 */
	public Wizard(Prompter prompter, ValueSource values, List<SetupStep> steps, Runnable start,
			Optional<String> version) {
		this.prompter = Objects.requireNonNull(prompter, "prompter");
		this.values = Objects.requireNonNull(values, "values");
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
	 * @return the exit code when the process must end: 0 after a cancel, and when no step planned a file. Empty when
	 * the application started.
	 * @throws SetupFailedException with exit code 1 after a missing or bad value in batch mode, and after
	 *                              a write failure; the message names the file or the key
	 */
	public OptionalInt run(String reason) {
		written = false;
		printBanner(reason);
		SetupContext context = new SetupContext(values);
		try {
			for (SetupStep step : steps) {
				if (step.applicable(context)) {
					step.run(context, prompter);
				}
			}
		}
		catch (SetupCancelledException ex) {
			prompter.print("");
			prompter.info(ex.getMessage());
			return OptionalInt.of(0);
		}
		FilePlan plan = context.filePlan();
		if (plan.isEmpty()) {
			return OptionalInt.of(0);
		}
		try {
			new FilePlanWriter(prompter::info).write(plan);
		}
		catch (SetupWriteException ex) {
			throw SetupFailedException.failure(ex.getMessage() + "\n" + ex.rollbackReport());
		}
		written = true;
		prompter.print("");
		prompter.success("Configuration written to " + plan.files().getFirst().path().getParent());
		prompter.progress("Starting OpenCelium...");
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

	/**
	 * The Enter, ? and q hint only when a question can come: the log of a batch run must not suggest a
	 * wait.
	 */
	private void printBanner(String reason) {
		prompter.print("");
		prompter.title("OpenCelium setup" + version.map(v -> " (" + v + ")").orElse(""));
		String opening = sentence(reason) + " Let's set up OpenCelium.";
		if (values.batch()) {
			prompter.info(opening);
		}
		else {
			prompter.info(opening, "Press Enter to accept the value in [brackets]. Type ? for help, q to quit.");
		}
		prompter.print("");
	}

	private static String sentence(String reason) {
		return Character.toUpperCase(reason.charAt(0)) + reason.substring(1) + ".";
	}

}

package io.opencelium.core.testsupport.fake;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.files.SetupActionException;

/**
 * An action of the plan that does nothing: each run and each undo adds a line to a log that the test owns, so a test
 * sees the order across several actions. A failing action throws after its log line; an undo can leave a note.
 */
public final class RecordingAction implements PlannedAction {

	private final String description;

	private final List<PlannedFile> files;

	private final List<String> log;

	private Optional<String> failure = Optional.empty();

	private Optional<String> leftover = Optional.empty();

	private Runnable runHook = () -> {
	};

	private Runnable undoHook = () -> {
	};

	/**
	 * @param log gets {@code run <description>} and {@code undo <description>}
	 */
	public RecordingAction(String description, List<String> log, PlannedFile... files) {
		this.description = Objects.requireNonNull(description, "description");
		this.log = Objects.requireNonNull(log, "log");
		this.files = List.of(files);
	}

	/** The run throws {@link SetupActionException} with {@code cause} as its message. */
	public RecordingAction failsWith(String cause) {
		failure = Optional.of(cause);
		return this;
	}

	/** The undo gives {@code note} as what is left for the user. */
	public RecordingAction leaves(String note) {
		leftover = Optional.of(note);
		return this;
	}

	/** Runs at the start of each run, for example to see which files are in place then. */
	public RecordingAction onRun(Runnable hook) {
		runHook = Objects.requireNonNull(hook, "hook");
		return this;
	}

	/** Runs at the start of each undo. */
	public RecordingAction onUndo(Runnable hook) {
		undoHook = Objects.requireNonNull(hook, "hook");
		return this;
	}

	@Override
	public String description() {
		return description;
	}

	@Override
	public List<PlannedFile> files() {
		return files;
	}

	@Override
	public void run() {
		runHook.run();
		log.add("run " + description);
		if (failure.isPresent()) {
			throw new SetupActionException(failure.get());
		}
	}

	@Override
	public Optional<String> undo() {
		undoHook.run();
		log.add("undo " + description);
		return leftover;
	}

}

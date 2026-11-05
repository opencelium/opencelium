package io.opencelium.core.setup.files;

import java.io.IOException;
import java.nio.file.AccessDeniedException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A planned file could not be written, or an action of the plan failed. The writer has already undone the actions
 * that ran, rolled back what this run made and put back the files it replaced; the report says whether that left
 * anything behind. The message names the target, not the staged copy, or the action and its cause. It never holds a
 * secret: the content of a file is not part of it.
 */
public final class SetupWriteException extends RuntimeException {

	private final Path path;

	private final int touched;

	private final int rolledBack;

	private final Map<Path, Path> keptBackups;

	private final List<String> notUndone;

	/**
	 * @param path        the target that failed
	 * @param touched     how many files this run staged or moved before the failure
	 * @param rolledBack  how many of them the rollback removed or put back again
	 * @param keptBackups the backup of each replaced file that could not be put back, by its target
	 */
	SetupWriteException(Path path, IOException cause, int touched, int rolledBack, Map<Path, Path> keptBackups) {
		this("Cannot write " + path + ": " + describe(cause), path, cause, touched, rolledBack, keptBackups,
				List.of());
	}

	/**
	 * @param message   the message of the file or of the action that failed
	 * @param path      the target that failed; for a failed action, the first file of the plan
	 * @param notUndone what the undo of the actions could not remove, 1 sentence for each
	 */
	SetupWriteException(String message, Path path, Exception cause, int touched, int rolledBack,
			Map<Path, Path> keptBackups, List<String> notUndone) {
		super(message, cause);
		this.path = path;
		this.touched = touched;
		this.rolledBack = rolledBack;
		// In the order of the plan, so the report lists the files as the summary did.
		this.keptBackups = Collections.unmodifiableMap(new LinkedHashMap<>(keptBackups));
		this.notUndone = List.copyOf(notUndone);
	}

	/** The target that failed; for a failed action, the first file of the plan. */
	public Path path() {
		return path;
	}

	/**
	 * "Nothing was written." when the rollback undid every file this run made or replaced and every action that ran;
	 * otherwise what to check, where the previous file is when it could not be put back, and what an action left.
	 */
	public String rollbackReport() {
		if (rolledBack == touched && notUndone.isEmpty()) {
			return "Nothing was written.";
		}
		var report = new StringBuilder(rolledBack == touched ? "The files were rolled back."
				: "Rolled back " + rolledBack + " of " + touched + " files; please check " + path.getParent() + ".");
		keptBackups.forEach((target, backup) -> report.append(" The previous ").append(target).append(" is kept at ")
				.append(backup).append('.'));
		notUndone.forEach(left -> report.append(' ').append(left));
		return report.toString();
	}

	/** The plain reason: the JDK messages are often only the path. */
	private static String describe(IOException cause) {
		return switch (cause) {
			case AccessDeniedException ex -> "permission denied";
			case FileAlreadyExistsException ex -> ex.getFile() + " is a file, not a directory";
			case NoSuchFileException ex -> ex.getFile() + " does not exist";
			default -> cause.getMessage() != null && !cause.getMessage().isBlank() ? cause.getMessage()
					: cause.getClass().getSimpleName();
		};
	}

}

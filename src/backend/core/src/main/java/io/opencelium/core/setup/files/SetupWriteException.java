package io.opencelium.core.setup.files;

import java.io.IOException;
import java.nio.file.AccessDeniedException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;

/**
 * A planned file could not be written. The writer has already rolled back what this run made; the report says
 * whether that left anything behind. The message names the target, not the staged copy, and never holds a secret:
 * the content of the file is not part of it.
 */
public final class SetupWriteException extends RuntimeException {

	private final Path path;

	private final int touched;

	private final int rolledBack;

	/**
	 * @param path       the target that failed
	 * @param touched    how many files this run staged or moved before the failure
	 * @param rolledBack how many of them the rollback removed again
	 */
	SetupWriteException(Path path, IOException cause, int touched, int rolledBack) {
		super("Cannot write " + path + ": " + describe(cause), cause);
		this.path = path;
		this.touched = touched;
		this.rolledBack = rolledBack;
	}

	public Path path() {
		return path;
	}

	/** "Nothing was written." when the rollback removed every file this run made; otherwise what to check. */
	public String rollbackReport() {
		if (rolledBack == touched) {
			return "Nothing was written.";
		}
		return "Rolled back " + rolledBack + " of " + touched + " files; please check " + path.getParent() + ".";
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

package io.opencelium.core.setup.files;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;

import static java.nio.file.StandardCopyOption.ATOMIC_MOVE;
import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;

/**
 * Writes a file plan so that a failure never leaves a half-written configuration. Every file is first staged as
 * {@code <target>.tmp-<random>} in its target directory, with its content and permissions; only then is each
 * staged file moved onto its target in one atomic step, replacing a file that exists. A missing target directory
 * is made. When anything fails, the writer deletes the staged files, the targets this run moved, and the
 * directories it made that are empty again, then throws {@link SetupWriteException} naming the target that failed.
 */
public final class FilePlanWriter {

	private static final String STAGE_INFIX = ".tmp-";

	static final String NO_POSIX_WARNING = "This file system has no POSIX permissions; the files keep the default"
			+ " permissions.";

	private final Consumer<String> warnings;

	private final boolean posixPermissions;

	/**
	 * @param warnings where a warning line goes; the wizard prints it on the console
	 */
	public FilePlanWriter(Consumer<String> warnings) {
		this(warnings, FileSystems.getDefault().supportedFileAttributeViews().contains("posix"));
	}

	FilePlanWriter(Consumer<String> warnings, boolean posixPermissions) {
		this.warnings = Objects.requireNonNull(warnings, "warnings");
		this.posixPermissions = posixPermissions;
	}

	/**
	 * @throws SetupWriteException when a file cannot be written; the rollback has run by then
	 */
	public void write(FilePlan plan) {
		if (plan.isEmpty()) {
			return;
		}
		if (!posixPermissions) {
			warnings.accept(NO_POSIX_WARNING);
		}
		var run = new Run();
		try {
			for (PlannedFile file : plan.files()) {
				run.current = file.path();
				run.stage(file);
			}
			for (PlannedFile file : plan.files()) {
				run.current = file.path();
				run.move(file);
			}
		}
		catch (IOException ex) {
			throw run.rollBack(ex);
		}
	}

	/** What one write has done so far, so the rollback knows what to remove. */
	private final class Run {

		/** The staged file of each target that is not moved yet. */
		private final Map<Path, Path> staged = new LinkedHashMap<>();

		private final List<Path> moved = new ArrayList<>();

		/** Top down, so the rollback removes them bottom up. */
		private final List<Path> madeDirectories = new ArrayList<>();

		private Path current;

		private void stage(PlannedFile file) throws IOException {
			Path target = file.path().toAbsolutePath();
			makeDirectories(target.getParent());
			// Made with owner-only permissions, so the content is never readable by others, not even briefly.
			Path stagedFile = Files.createTempFile(target.getParent(), target.getFileName() + STAGE_INFIX, "");
			staged.put(file.path(), stagedFile);
			Files.writeString(stagedFile, file.content());
			if (posixPermissions) {
				Files.setPosixFilePermissions(stagedFile, file.permissions());
			}
		}

		private void move(PlannedFile file) throws IOException {
			Files.move(staged.get(file.path()), file.path(), ATOMIC_MOVE, REPLACE_EXISTING);
			staged.remove(file.path());
			moved.add(file.path());
		}

		private void makeDirectories(Path directory) throws IOException {
			Deque<Path> missing = new ArrayDeque<>();
			for (Path dir = directory; dir != null && !Files.exists(dir); dir = dir.getParent()) {
				missing.push(dir);
			}
			// A path that exists but is not a directory fails here, naming it.
			Files.createDirectories(directory);
			madeDirectories.addAll(missing);
		}

		private SetupWriteException rollBack(IOException cause) {
			int touched = staged.size() + moved.size();
			int removed = 0;
			for (Path file : staged.values()) {
				removed += delete(file) ? 1 : 0;
			}
			for (Path file : moved) {
				removed += delete(file) ? 1 : 0;
			}
			for (Path directory : madeDirectories.reversed()) {
				delete(directory);
			}
			return new SetupWriteException(current, cause, touched, removed);
		}

	}

	/** A directory that is not empty stays, as does anything that cannot be deleted; the report counts the rest. */
	private static boolean delete(Path path) {
		try {
			Files.deleteIfExists(path);
			return true;
		}
		catch (IOException ex) {
			return false;
		}
	}

}

package io.opencelium.core.setup.files;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * The files the wizard will write and the actions it runs after them, in order: the steps add entries, and the
 * wizard carries them out in one go after the summary. A path is planned at most once, also when an action brings
 * it, so two steps cannot silently compete for the same file.
 */
public final class FilePlan {

	private final List<PlannedFile> files = new ArrayList<>();

	private final List<PlannedAction> actions = new ArrayList<>();

	/**
	 * @throws IllegalArgumentException when a file with the same path is already planned
	 */
	public void add(PlannedFile file) {
		requireNew(file.path());
		files.add(file);
	}

	/**
	 * @throws IllegalArgumentException when a file of the action has a path that is already planned
	 */
	public void add(PlannedAction action) {
		action.files().forEach(file -> requireNew(file.path()));
		actions.add(action);
	}

	/** The files added on their own first, then the files of the actions; each group in the order of the adds. */
	public List<PlannedFile> files() {
		return Stream.concat(files.stream(), actions.stream().flatMap(action -> action.files().stream())).toList();
	}

	/** The actions to run after the files are written, in the order of the adds. */
	public List<PlannedAction> actions() {
		return List.copyOf(actions);
	}

	public boolean isEmpty() {
		return files.isEmpty() && actions.isEmpty();
	}

	private void requireNew(Path path) {
		if (files().stream().anyMatch(planned -> planned.path().equals(path))) {
			throw new IllegalArgumentException(path + " is already planned.");
		}
	}

}

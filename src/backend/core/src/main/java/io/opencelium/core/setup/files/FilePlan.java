package io.opencelium.core.setup.files;

import java.util.ArrayList;
import java.util.List;

/**
 * The files the wizard will write, in order: the steps add entries, and the wizard writes them in one go after
 * the summary. A path is planned at most once, so two steps cannot silently compete for the same file.
 */
public final class FilePlan {

	private final List<PlannedFile> files = new ArrayList<>();

	/**
	 * @throws IllegalArgumentException when a file with the same path is already planned
	 */
	public void add(PlannedFile file) {
		if (files.stream().anyMatch(planned -> planned.path().equals(file.path()))) {
			throw new IllegalArgumentException(file.path() + " is already planned.");
		}
		files.add(file);
	}

	/**
	 * @throws IllegalArgumentException when a file of the action has a path that is already planned
	 */
	public void add(PlannedAction action) {
		throw new UnsupportedOperationException();
	}

	public List<PlannedFile> files() {
		return List.copyOf(files);
	}

	/** The actions to run after the files are written, in the order of the adds. */
	public List<PlannedAction> actions() {
		throw new UnsupportedOperationException();
	}

	public boolean isEmpty() {
		return files.isEmpty();
	}

}

package io.opencelium.core.setup.files;

import java.util.List;
import java.util.Optional;

/**
 * A side effect that the plan runs after its files are in place, for example the start of MongoDB with Docker
 * Compose. The files of an action are written together with the other files of the plan, so the rollback of a
 * failure covers them too. An action prints its own progress, through the prompter of the step that planned it.
 */
public interface PlannedAction {

	/** One line for the summary, for example {@code Start MongoDB with Docker Compose in /srv/oc/quickstart}. */
	String description();

	/** The files that the action needs, written with the files of the plan before the first action runs. */
	List<PlannedFile> files();

	/**
	 * @throws SetupActionException when the action fails; the message names the cause, and the plan rolls back
	 */
	void run();

	/**
	 * Undoes what {@link #run()} made, also after a run that failed half-way. It runs while the files of the action
	 * are still in place.
	 *
	 * @return what is left for the user to remove by hand; empty when nothing is left
	 */
	Optional<String> undo();

}

package io.opencelium.core.setup.files;

import java.nio.file.Path;
import java.util.ArrayList;

import org.junit.jupiter.api.Test;

import io.opencelium.core.testsupport.fake.RecordingAction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

/**
 * The ordered list of files to write and of actions to run after them: the steps add entries, a path is planned at
 * most once, also when an action brings it.
 */
class FilePlanTest {

	private final FilePlan plan = new FilePlan();

	@Test
	void filesKeepTheOrderOfAddition() {
		PlannedFile yml = PlannedFile.groupReadable(Path.of("/x/application.yml"), "a");
		PlannedFile env = PlannedFile.ownerOnly(Path.of("/x/opencelium.env"), "b");

		plan.add(yml);
		plan.add(env);

		assertThat(plan.isEmpty()).isFalse();
		assertThat(plan.files()).containsExactly(yml, env);
	}

	@Test
	void addRejectsAPathPlannedTwice() {
		plan.add(PlannedFile.groupReadable(Path.of("/x/application.yml"), "a"));

		assertThatIllegalArgumentException()
				.isThrownBy(() -> plan.add(PlannedFile.ownerOnly(Path.of("/x/application.yml"), "b")))
				.withMessageContaining("/x/application.yml");
	}

	@Test
	void filesListActionFilesAfterOwnFilesWhenAnActionIsPlanned() {
		PlannedFile compose = PlannedFile.groupReadable(Path.of("/x/quickstart/docker-compose.yml"), "c");
		var action = new RecordingAction("start", new ArrayList<>(), compose);
		PlannedFile yml = PlannedFile.groupReadable(Path.of("/x/application.yml"), "a");

		plan.add(action);
		plan.add(yml);

		assertThat(plan.files()).containsExactly(yml, compose);
		assertThat(plan.actions()).containsExactly(action);
	}

	@Test
	void addRejectsActionWhenItsFileIsPlannedAlready() {
		plan.add(PlannedFile.groupReadable(Path.of("/x/application.yml"), "a"));
		var action = new RecordingAction("start", new ArrayList<>(),
				PlannedFile.ownerOnly(Path.of("/x/application.yml"), "b"));

		assertThatIllegalArgumentException().isThrownBy(() -> plan.add(action))
				.withMessageContaining("/x/application.yml");
		assertThat(plan.actions()).isEmpty();
	}

	@Test
	void plannedFileCarriesThePermissionsOfItsKind() {
		assertThat(PlannedFile.groupReadable(Path.of("/x/a"), "").permissions()).isEqualTo(PlannedFile.GROUP_READABLE);
		assertThat(PlannedFile.ownerOnly(Path.of("/x/b"), "").permissions()).isEqualTo(PlannedFile.OWNER_ONLY);
	}

}

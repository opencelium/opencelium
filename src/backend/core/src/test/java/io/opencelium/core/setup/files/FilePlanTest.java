package io.opencelium.core.setup.files;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

/** The ordered list of files to write: the steps add entries, a path is planned at most once. */
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
	void plannedFileCarriesThePermissionsOfItsKind() {
		assertThat(PlannedFile.groupReadable(Path.of("/x/a"), "").permissions()).isEqualTo(PlannedFile.GROUP_READABLE);
		assertThat(PlannedFile.ownerOnly(Path.of("/x/b"), "").permissions()).isEqualTo(PlannedFile.OWNER_ONLY);
	}

}

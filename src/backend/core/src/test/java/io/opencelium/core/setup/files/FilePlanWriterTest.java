package io.opencelium.core.setup.files;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.testsupport.fake.RecordingAction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The write of a file plan: every file is staged next to its target, gets its permissions, and is moved into place;
 * the configuration directory is made when it is missing. Then the actions of the plan run in order. A failure
 * anywhere rolls back what this run made, the actions that ran included, so a half-written configuration never
 * remains, and the exception names the file or the action that failed.
 */
class FilePlanWriterTest {

	@TempDir
	Path tmp;

	private final List<String> warnings = new ArrayList<>();

	private final FilePlanWriter writer = new FilePlanWriter(warnings::add);

	@Test
	void writeMakesAllFilesWhenPlanIsValid() throws IOException {
		Files.createDirectory(tmp.resolve("config"));

		writer.write(plan(yml("server:\n  port: 9090\n"), env("# none\n")));

		assertThat(tmp.resolve("config/application.yml")).content().isEqualTo("server:\n  port: 9090\n");
		assertThat(tmp.resolve("config/opencelium.env")).content().isEqualTo("# none\n");
		assertThat(warnings).isEmpty();
	}

	@Test
	void writeMakesConfigDirectoryWhenMissing() {
		writer.write(plan(yml("a\n"), env("b\n")));

		assertThat(tmp.resolve("config")).isDirectory();
		assertThat(tmp.resolve("config/application.yml")).content().isEqualTo("a\n");
	}

	@Test
	void writeSetsGroupReadableYmlAndOwnerOnlyEnvFile() throws IOException {
		assumeTrue(FileSystems.getDefault().supportedFileAttributeViews().contains("posix"), "POSIX permissions");

		writer.write(plan(yml("a\n"), env("b\n")));

		assertThat(permissions(tmp.resolve("config/application.yml"))).isEqualTo("rw-r-----");
		assertThat(permissions(tmp.resolve("config/opencelium.env"))).isEqualTo("rw-------");
	}

	@Test
	void writeLeavesNoStagedFileAfterSuccess() throws IOException {
		writer.write(plan(yml("a\n"), env("b\n")));

		assertThat(entries(tmp.resolve("config"))).containsExactlyInAnyOrder("application.yml", "opencelium.env");
	}

	@Test
	void writeReplacesExistingFile() throws IOException {
		Files.createDirectory(tmp.resolve("config"));
		Files.writeString(tmp.resolve("config/application.yml"), "old\n");

		writer.write(plan(yml("new\n"), env("b\n")));

		assertThat(tmp.resolve("config/application.yml")).content().isEqualTo("new\n");
	}

	@Test
	void writeRollsBackEarlierFilesWhenLaterFileFails() throws IOException {
		Files.createDirectory(tmp.resolve("config"));
		Files.writeString(tmp.resolve("config/blocker"), "a file where a directory is needed");
		Path failing = tmp.resolve("config/blocker/opencelium.env");

		SetupWriteException ex = assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> writer.write(plan(yml("a\n"), PlannedFile.ownerOnly(failing, "b\n")))).actual();

		assertThat(ex.path()).isEqualTo(failing);
		assertThat(ex.getMessage()).startsWith("Cannot write " + failing + ": ");
		assertThat(ex.rollbackReport()).isEqualTo("Nothing was written.");
		assertThat(entries(tmp.resolve("config"))).containsExactly("blocker");
	}

	@Test
	void writeRollsBackMovedFilesWhenALaterMoveFails() throws IOException {
		// A non-empty directory in the place of the second file: staging works, the move onto it cannot.
		Files.createDirectories(tmp.resolve("config/opencelium.env"));
		Files.writeString(tmp.resolve("config/opencelium.env/child"), "x");

		SetupWriteException ex = assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> writer.write(plan(yml("a\n"), env("b\n")))).actual();

		assertThat(ex.path()).isEqualTo(tmp.resolve("config/opencelium.env"));
		assertThat(ex.rollbackReport()).isEqualTo("Nothing was written.");
		assertThat(entries(tmp.resolve("config"))).containsExactly("opencelium.env");
	}

	@Test
	void writeRestoresReplacedFileWhenALaterMoveFails() throws IOException {
		// The second run of the setup: a configuration exists, and the move of the second file cannot be done.
		Files.createDirectories(tmp.resolve("config/opencelium.env"));
		Files.writeString(tmp.resolve("config/opencelium.env/child"), "x");
		Files.writeString(tmp.resolve("config/application.yml"), "old\n");

		SetupWriteException ex = assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> writer.write(plan(yml("new\n"), env("b\n")))).actual();

		assertThat(tmp.resolve("config/application.yml")).content().isEqualTo("old\n");
		assertThat(ex.rollbackReport()).isEqualTo("Nothing was written.");
		assertThat(entries(tmp.resolve("config"))).containsExactlyInAnyOrder("application.yml", "opencelium.env");
	}

	@Test
	void writeKeepsOldFileAsBak() throws IOException {
		// The second run of the setup: the files of the first run exist, and an older backup too.
		Files.createDirectory(tmp.resolve("config"));
		Files.writeString(tmp.resolve("config/application.yml"), "old\n");
		Files.writeString(tmp.resolve("config/application.yml.bak"), "older\n");
		Files.writeString(tmp.resolve("config/opencelium.env"), "OLD=1\n");

		writer.write(plan(yml("new\n"), env("NEW=1\n")));

		assertThat(tmp.resolve("config/application.yml")).content().isEqualTo("new\n");
		assertThat(tmp.resolve("config/application.yml.bak")).content().isEqualTo("old\n");
		assertThat(tmp.resolve("config/opencelium.env.bak")).content().isEqualTo("OLD=1\n");
		assertThat(entries(tmp.resolve("config"))).containsExactlyInAnyOrder("application.yml", "application.yml.bak",
				"opencelium.env", "opencelium.env.bak");
		assertThat(warnings).isEmpty();
	}

	@Test
	void writeKeepsTheOwnerOnlyPermissionsWhenItKeepsTheOldEnvFile() throws IOException {
		assumeTrue(FileSystems.getDefault().supportedFileAttributeViews().contains("posix"), "POSIX permissions");
		Files.createDirectory(tmp.resolve("config"));
		Files.writeString(tmp.resolve("config/opencelium.env"), "OLD=1\n");
		Files.setPosixFilePermissions(tmp.resolve("config/opencelium.env"), PosixFilePermissions.fromString("rw-------"));

		writer.write(plan(yml("new\n"), env("NEW=1\n")));

		// The old env file holds the old MongoDB URI with its database password.
		assertThat(permissions(tmp.resolve("config/opencelium.env.bak"))).isEqualTo("rw-------");
	}

	@Test
	void writeRemovesDirectoryItMadeWhenRollbackEmptiesIt() throws IOException {
		Files.writeString(tmp.resolve("blocker"), "a file where a directory is needed");

		assertThatExceptionOfType(SetupWriteException.class).isThrownBy(() -> writer.write(
				plan(yml("a\n"), PlannedFile.ownerOnly(tmp.resolve("blocker/opencelium.env"), "b\n"))));

		assertThat(tmp.resolve("config")).doesNotExist();
	}

	@Test
	void writeKeepsDirectoryThatExistedBefore() throws IOException {
		Files.createDirectory(tmp.resolve("config"));
		Files.writeString(tmp.resolve("blocker"), "a file where a directory is needed");

		assertThatExceptionOfType(SetupWriteException.class).isThrownBy(() -> writer.write(
				plan(yml("a\n"), PlannedFile.ownerOnly(tmp.resolve("blocker/opencelium.env"), "b\n"))));

		assertThat(tmp.resolve("config")).isDirectory();
		assertThat(entries(tmp.resolve("config"))).isEmpty();
	}

	@Test
	void writeThrowsSetupWriteExceptionNamingFailedPath() throws IOException {
		Files.writeString(tmp.resolve("blocker"), "a file where a directory is needed");
		Path failing = tmp.resolve("blocker/application.yml");

		SetupWriteException ex = assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> writer.write(plan(PlannedFile.groupReadable(failing, "a\n")))).actual();

		assertThat(ex.path()).isEqualTo(failing);
		assertThat(ex.getMessage()).contains(failing.toString());
		assertThat(ex.getCause()).isInstanceOf(IOException.class);
	}

	@Test
	void writeWarnsOnceAndKeepsDefaultPermissionsWithoutPosix() throws IOException {
		var withoutPosix = new FilePlanWriter(warnings::add, false);

		withoutPosix.write(plan(yml("a\n"), env("b\n")));

		assertThat(tmp.resolve("config/opencelium.env")).content().isEqualTo("b\n");
		assertThat(warnings).containsExactly(
				"This file system has no POSIX permissions; the files keep the default permissions.");
	}

	@Test
	void writeRunsActionsInOrderAfterTheFilesWhenPlanHasActions() {
		List<String> log = new ArrayList<>();
		PlannedFile unit = PlannedFile.groupReadable(tmp.resolve("systemd/opencelium.service"), "c\n");
		List<Boolean> inPlaceAtRun = new ArrayList<>();
		FilePlan plan = plan(yml("a\n"), env("b\n"));
		plan.add(new RecordingAction("first", log, unit).onRun(() -> inPlaceAtRun.add(
				Files.exists(tmp.resolve("config/application.yml")) && Files.exists(unit.path()))));
		plan.add(new RecordingAction("second", log));

		writer.write(plan);

		assertThat(log).containsExactly("run first", "run second");
		assertThat(inPlaceAtRun).containsExactly(true);
		assertThat(unit.path()).content().isEqualTo("c\n");
	}

	@Test
	void writeUndoesTheActionsAndRollsBackTheFilesWhenAnActionFails() throws IOException {
		Files.createDirectory(tmp.resolve("config"));
		Files.writeString(tmp.resolve("config/application.yml"), "old\n");
		List<String> log = new ArrayList<>();
		PlannedFile unit = PlannedFile.groupReadable(tmp.resolve("systemd/opencelium.service"), "c\n");
		List<Boolean> inPlaceAtUndo = new ArrayList<>();
		FilePlan plan = plan(yml("new\n"), env("b\n"));
		plan.add(new RecordingAction("first", log, unit)
				.onUndo(() -> inPlaceAtUndo.add(Files.exists(unit.path()))));
		plan.add(new RecordingAction("second", log).failsWith("Cannot start the second action: it failed."));

		SetupWriteException ex = assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> writer.write(plan)).actual();

		assertThat(ex.getMessage()).isEqualTo("Cannot start the second action: it failed.");
		assertThat(ex.getCause()).isInstanceOf(SetupActionException.class);
		assertThat(ex.rollbackReport()).isEqualTo("Nothing was written.");
		assertThat(log).containsExactly("run first", "run second", "undo second", "undo first");
		assertThat(inPlaceAtUndo).containsExactly(true);
		assertThat(tmp.resolve("config/application.yml")).content().isEqualTo("old\n");
		assertThat(entries(tmp.resolve("config"))).containsExactly("application.yml");
		assertThat(tmp.resolve("systemd")).doesNotExist();
	}

	@Test
	void writeUndoesTheActionsAndRollsBackTheFilesThenRethrowsWhenAnActionIsCancelled() throws IOException {
		Files.createDirectory(tmp.resolve("config"));
		Files.writeString(tmp.resolve("config/application.yml"), "old\n");
		List<String> log = new ArrayList<>();
		PlannedFile key = PlannedFile.ownerOnly(tmp.resolve("data/master.key"), "a2V5\n");
		FilePlan plan = plan(yml("new\n"), env("b\n"));
		plan.add(new RecordingAction("first", log, key));
		plan.add(new RecordingAction("second", log).onRun(() -> {
			throw new SetupCancelledException();
		}));

		assertThatExceptionOfType(SetupCancelledException.class).isThrownBy(() -> writer.write(plan));

		assertThat(log).containsExactly("run first", "undo second", "undo first");
		assertThat(tmp.resolve("config/application.yml")).content().isEqualTo("old\n");
		assertThat(entries(tmp.resolve("config"))).containsExactly("application.yml");
		assertThat(tmp.resolve("data")).doesNotExist();
	}

	@Test
	void writeNamesWhatAnUndoLeftWhenAnActionFails() {
		List<String> log = new ArrayList<>();
		FilePlan plan = plan(yml("a\n"), env("b\n"));
		plan.add(new RecordingAction("first", log).leaves("Remove the service by hand: systemctl disable opencelium."));
		plan.add(new RecordingAction("second", log).failsWith("Cannot start the second action: it failed."));

		SetupWriteException ex = assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> writer.write(plan)).actual();

		assertThat(ex.rollbackReport()).contains("Remove the service by hand: systemctl disable opencelium.")
				.doesNotContain("Nothing was written.");
		assertThat(tmp.resolve("config/application.yml")).doesNotExist();
	}

	@Test
	void rollbackReportCountsWhatCouldNotBeRemoved() {
		var ex = new SetupWriteException(tmp.resolve("config/opencelium.env"), new IOException("disk full"), 2, 1,
				Map.of());

		assertThat(ex.getMessage()).isEqualTo("Cannot write " + tmp.resolve("config/opencelium.env") + ": disk full");
		assertThat(ex.rollbackReport()).isEqualTo("Rolled back 1 of 2 files; please check " + tmp.resolve("config")
				+ ".");
	}

	@Test
	void rollbackReportNamesTheBackupWhenAReplacedFileCouldNotBeRestored() {
		Path target = tmp.resolve("config/application.yml");
		Path backup = tmp.resolve("config/application.yml.bak-123");
		var ex = new SetupWriteException(tmp.resolve("config/opencelium.env"), new IOException("disk full"), 2, 1,
				Map.of(target, backup));

		assertThat(ex.rollbackReport()).isEqualTo("Rolled back 1 of 2 files; please check " + tmp.resolve("config")
				+ ". The previous " + target + " is kept at " + backup + ".");
	}

	private PlannedFile yml(String content) {
		return PlannedFile.groupReadable(tmp.resolve("config/application.yml"), content);
	}

	private PlannedFile env(String content) {
		return PlannedFile.ownerOnly(tmp.resolve("config/opencelium.env"), content);
	}

	private static FilePlan plan(PlannedFile... files) {
		var plan = new FilePlan();
		for (PlannedFile file : files) {
			plan.add(file);
		}
		return plan;
	}

	private static String permissions(Path file) throws IOException {
		return PosixFilePermissions.toString(Files.getPosixFilePermissions(file));
	}

	private static List<String> entries(Path directory) throws IOException {
		try (Stream<Path> children = Files.list(directory)) {
			return children.map(child -> child.getFileName().toString()).toList();
		}
	}

}

package io.opencelium.core.setup.files;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The write of a file plan: every file is staged next to its target, gets its permissions, and is moved into place;
 * the configuration directory is made when it is missing. A failure anywhere rolls back what this run made, so a
 * half-written configuration never remains, and the exception names the file that failed.
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
	void rollbackReportCountsWhatCouldNotBeRemoved() {
		var ex = new SetupWriteException(tmp.resolve("config/opencelium.env"), new IOException("disk full"), 2, 1);

		assertThat(ex.getMessage()).isEqualTo("Cannot write " + tmp.resolve("config/opencelium.env") + ": disk full");
		assertThat(ex.rollbackReport()).isEqualTo("Rolled back 1 of 2 files; please check " + tmp.resolve("config")
				+ ".");
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

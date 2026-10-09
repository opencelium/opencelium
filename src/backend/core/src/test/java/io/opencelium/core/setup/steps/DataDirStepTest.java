package io.opencelium.core.setup.steps;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The data directory question: the host default in brackets, with the home directory shown as {@code ~}; a typed
 * path made absolute, {@code ~} expanded; a directory that does not exist yet is fine under a writable parent; a
 * file or an unwritable place is explained and asked again. The step only checks; nothing is made before the
 * summary.
 */
class DataDirStepTest {

	@TempDir
	Path tmp;

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final SetupContext context = new SetupContext();

	@Test
	void runStoresDefaultWhenInputIsEmpty() {
		console.type("");

		step(tmp.resolve("data")).run(context, prompter());

		assertThat(context.dataDir()).contains(tmp.resolve("data"));
		assertThat(console.output()).contains("?  Data directory  [" + tmp.resolve("data") + "] ❯ ");
	}

	@Test
	void runStoresTypedPathAbsoluteAndNormalized() {
		console.type(tmp + "/a/../b");

		step(tmp).run(context, prompter());

		assertThat(context.dataDir()).contains(tmp.resolve("b"));
	}

	@Test
	void runAcceptsExistingWritableDirectory() {
		console.type(tmp.toString());

		step(tmp.resolve("other")).run(context, prompter());

		assertThat(context.dataDir()).contains(tmp);
	}

	@Test
	void runAcceptsPathThatDoesNotExistUnderWritableParent() {
		console.type(tmp.resolve("new/deeper").toString());

		step(tmp).run(context, prompter());

		assertThat(context.dataDir()).contains(tmp.resolve("new/deeper"));
		assertThat(console.output()).doesNotContain("cannot be created");
	}

	@Test
	void runAsksAgainWhenPathIsAFile() throws IOException {
		Path file = Files.writeString(tmp.resolve("file"), "x");
		console.type(file.toString(), tmp.toString());

		step(tmp).run(context, prompter());

		assertThat(context.dataDir()).contains(tmp);
		assertThat(console.output()).contains(file + " is a file, not a directory.");
	}

	@Test
	void runAsksAgainWhenParentIsNotWritable() throws IOException {
		assumeTrue(posix() && !root(), "needs POSIX permissions and a user that they apply to");
		Path locked = Files.createDirectory(tmp.resolve("locked"));
		Files.setPosixFilePermissions(locked, PosixFilePermissions.fromString("r-x------"));
		try {
			console.type(locked.resolve("data").toString(), tmp.toString());

			step(tmp).run(context, prompter());

			assertThat(context.dataDir()).contains(tmp);
			assertThat(console.output()).contains(locked.resolve("data") + " cannot be created: " + locked
					+ " is not writable by this user.");
		}
		finally {
			Files.setPosixFilePermissions(locked, PosixFilePermissions.fromString("rwx------"));
		}
	}

	@Test
	void runShowsHomeDirectoryAsTildeInTheDefault() {
		console.type("");

		step(home().resolve("oc/data")).run(context, prompter());

		assertThat(console.output()).contains("?  Data directory  [~/oc/data] ❯ ");
		assertThat(context.dataDir()).contains(home().resolve("oc/data"));
	}

	@Test
	void runShowsHomeDirectoryItselfAsTilde() {
		console.type("");

		step(home()).run(context, prompter());

		assertThat(console.output()).contains("[~] ❯ ");
		assertThat(context.dataDir()).contains(home());
	}

	@Test
	void runExpandsTildeInTypedPath() {
		console.type("~/typed/data", "~");

		step(tmp).run(context, prompter());
		assertThat(context.dataDir()).contains(home().resolve("typed/data"));

		step(tmp).run(context, prompter());
		assertThat(context.dataDir()).contains(home());
	}

	@Test
	void runMakesNoDirectory() {
		console.type(tmp.resolve("not-yet").toString());

		step(tmp).run(context, prompter());

		assertThat(tmp.resolve("not-yet")).doesNotExist();
	}

	private ConsolePrompter prompter() {
		return new ConsolePrompter(console);
	}

	private DataDirStep step(Path defaultDir) {
		return new DataDirStep(defaultDir, home());
	}

	/** A home directory under the temporary directory, so the tests never touch the real one. */
	private Path home() {
		return tmp.resolve("home");
	}

	private static boolean posix() {
		return FileSystems.getDefault().supportedFileAttributeViews().contains("posix");
	}

	private static boolean root() {
		return "root".equals(System.getProperty("user.name"));
	}

}

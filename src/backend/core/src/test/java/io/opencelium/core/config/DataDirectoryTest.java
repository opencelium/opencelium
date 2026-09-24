package io.opencelium.core.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.DisabledOnOs;
import org.junit.jupiter.api.condition.OS;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class DataDirectoryTest {

	@TempDir
	Path tmp;

	@Test
	void missingDirectoryIsCreatedWithParents() {
		Path dir = tmp.resolve("a/b/data");

		DataDirectory dataDirectory = DataDirectory.prepare(dir);

		assertThat(dataDirectory.path()).isEqualTo(dir);
		assertThat(dir).isDirectory();
	}

	@Test
	void existingDirectoryIsAccepted() {
		assertThat(DataDirectory.prepare(tmp).path()).isEqualTo(tmp);
	}

	@Test
	@DisabledOnOs(OS.WINDOWS)
	void directoryThatIsNotWritableStopsNamingTheProperty() throws Exception {
		Path readOnly = Files.createDirectory(tmp.resolve("read-only"),
				PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("r-xr-xr-x")));

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> DataDirectory.prepare(readOnly))
				.withMessageContaining("not writable")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("opencelium.data-dir"));
	}

	@Test
	@DisabledOnOs(OS.WINDOWS)
	void directoryThatCannotBeCreatedStopsNamingTheProperty() throws Exception {
		Path readOnly = Files.createDirectory(tmp.resolve("read-only"),
				PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("r-xr-xr-x")));

		assertThatExceptionOfType(BootstrapPropertyException.class)
				.isThrownBy(() -> DataDirectory.prepare(readOnly.resolve("data")))
				.withMessageContaining("cannot be created")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("opencelium.data-dir"));
	}

	@Test
	void startupCreatesTheConfiguredDirectory() {
		Path dir = tmp.resolve("data");

		new ApplicationContextRunner().withUserConfiguration(BootstrapConfig.class)
				.withPropertyValues("opencelium.deployment-mode=self", "opencelium.data-dir=" + dir)
				.run(context -> {
					assertThat(context).hasNotFailed();
					assertThat(context.getBean(DataDirectory.class).path()).isEqualTo(dir);
					assertThat(dir).isDirectory();
				});
	}

}

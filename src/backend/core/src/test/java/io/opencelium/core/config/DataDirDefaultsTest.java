package io.opencelium.core.config;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class DataDirDefaultsTest {

	@TempDir
	Path tmp;

	@Test
	void macOsUsesDataNextToWorkingDirectory() {
		var defaults = new DataDirDefaults("Mac OS X", tmp.resolve("work"), tmp.resolve("var-lib"));

		assertThat(defaults.resolve()).isEqualTo(tmp.resolve("work").resolve("data"));
	}

	@Test
	void windowsUsesDataNextToWorkingDirectory() {
		var defaults = new DataDirDefaults("Windows 11", tmp.resolve("work"), tmp.resolve("var-lib"));

		assertThat(defaults.resolve()).isEqualTo(tmp.resolve("work").resolve("data"));
	}

	@Test
	void linuxUsesSystemDirectoryWhenItExistsAndIsWritable() throws Exception {
		Path systemDir = Files.createDirectory(tmp.resolve("var-lib"));
		var defaults = new DataDirDefaults("Linux", tmp.resolve("work"), systemDir);

		assertThat(defaults.resolve()).isEqualTo(systemDir);
	}

	@Test
	void linuxFallsBackToWorkingDirectoryWhenSystemDirectoryIsMissing() {
		var defaults = new DataDirDefaults("Linux", tmp.resolve("work"), tmp.resolve("var-lib"));

		assertThat(defaults.resolve()).isEqualTo(tmp.resolve("work").resolve("data"));
	}

}

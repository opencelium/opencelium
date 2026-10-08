package io.opencelium.core.config;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class DataDirDefaultsTest {

	@TempDir
	Path tmp;

	Path work;

	Path varLib;

	@BeforeEach
	void directories() {
		work = tmp.resolve("work");
		varLib = tmp.resolve("var-lib");
	}

	@Test
	void macOsUsesDataNextToWorkingDirectory() {
		var defaults = new DataDirDefaults("Mac OS X", work, varLib);

		assertThat(defaults.resolve()).isEqualTo(work.resolve("data"));
	}

	@Test
	void windowsUsesDataNextToWorkingDirectory() {
		var defaults = new DataDirDefaults("Windows 11", work, varLib);

		assertThat(defaults.resolve()).isEqualTo(work.resolve("data"));
	}

	@Test
	void linuxUsesSystemDirectoryWhenItExistsAndIsWritable() throws Exception {
		Path systemDir = Files.createDirectory(varLib);
		var defaults = new DataDirDefaults("Linux", work, systemDir);

		assertThat(defaults.resolve()).isEqualTo(systemDir);
	}

	@Test
	void linuxFallsBackToWorkingDirectoryWhenSystemDirectoryIsMissing() {
		var defaults = new DataDirDefaults("Linux", work, varLib);

		assertThat(defaults.resolve()).isEqualTo(work.resolve("data"));
	}

}

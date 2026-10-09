package io.opencelium.core.setup;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Where the launcher looks for a configuration file before it decides on the wizard: {@code ./config/}, {@code ./},
 * then the system directory ({@code /etc/opencelium} on a real host), each with the three file names Spring Boot
 * reads. Relative to the working directory, as Boot's own locations are, not to the jar.
 */
class ConfigLocationsTest {

	@TempDir
	Path workingDir;

	private ConfigLocations locations;

	@BeforeEach
	void locationsUnderTheWorkingDirectory() {
		locations = new ConfigLocations(workingDir, workingDir.resolve("etc/opencelium"));
	}

	@Test
	void findPrefersConfigDirectoryOverWorkingDirectory() throws IOException {
		Path inConfigDirectory = touch("config/application.yml");
		touch("application.yml");
		touch("etc/opencelium/application.yml");

		assertThat(locations.find()).contains(inConfigDirectory);
	}

	@Test
	void findPrefersWorkingDirectoryOverSystemDirectory() throws IOException {
		Path nextToTheJar = touch("application.yml");
		touch("etc/opencelium/application.yml");

		assertThat(locations.find()).contains(nextToTheJar);
	}

	@Test
	void findReturnsSystemFileWhenNothingElseExists() throws IOException {
		Path system = touch("etc/opencelium/application.yml");

		assertThat(locations.find()).contains(system);
	}

	@Test
	void findAcceptsAllThreeFileNames() throws IOException {
		for (String name : List.of("application.yml", "application.yaml", "application.properties")) {
			Path file = touch("config/" + name);

			assertThat(locations.find()).as(name).contains(file);

			Files.delete(file);
		}
	}

	@Test
	void findReturnsEmptyWhenNoFileExists() {
		assertThat(locations.find()).isEmpty();
	}

	@Test
	void findIgnoresDirectoryNamedLikeConfigFile() throws IOException {
		Files.createDirectories(workingDir.resolve("config/application.yml"));

		assertThat(locations.find()).isEmpty();
	}

	@Test
	void writeDirectoryIsConfigUnderWorkingDirectory() {
		assertThat(locations.writeDirectory()).isEqualTo(workingDir.resolve("config"));
	}

	@Test
	void ymlFileAndEnvFileAreUnderTheWriteDirectory() {
		assertThat(locations.ymlFile()).isEqualTo(workingDir.resolve("config/application.yml"));
		assertThat(locations.envFile()).isEqualTo(workingDir.resolve("config/opencelium.env"));
	}

	@Test
	void isSystemLocationIsTrueOnlyUnderSystemDirectory() {
		assertThat(locations.isSystemLocation(workingDir.resolve("etc/opencelium/application.yml"))).isTrue();
		assertThat(locations.isSystemLocation(workingDir.resolve("config/application.yml"))).isFalse();
		assertThat(locations.isSystemLocation(workingDir.resolve("application.yml"))).isFalse();
	}

	private Path touch(String relative) throws IOException {
		Path file = workingDir.resolve(relative);
		Files.createDirectories(file.getParent());
		return Files.writeString(file, "");
	}

}

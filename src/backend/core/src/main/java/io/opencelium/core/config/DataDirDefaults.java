package io.opencelium.core.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

/**
 * The documented default for {@code opencelium.data-dir}: on Linux {@code /var/lib/opencelium} when it exists and
 * is writable, otherwise {@code ./data} in the working directory. The setup wizard offers the same default.
 */
public record DataDirDefaults(String osName, Path workingDir, Path linuxSystemDir) {

	public static DataDirDefaults forThisHost() {
		return new DataDirDefaults(System.getProperty("os.name", ""), Path.of("").toAbsolutePath(),
				Path.of("/var/lib/opencelium"));
	}

	public Path resolve() {
		boolean linux = osName.toLowerCase(Locale.ROOT).startsWith("linux");
		if (linux && Files.isDirectory(linuxSystemDir) && Files.isWritable(linuxSystemDir)) {
			return linuxSystemDir;
		}
		return workingDir.resolve("data");
	}

}

package io.opencelium.core.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.entry;

/**
 * The env file as the start reads it: comment lines, empty lines, {@code KEY=value}, and {@code KEY="value"} with a
 * backslash before {@code \ " $} and the backtick. That is the form the setup wizard writes and the form POSIX sh
 * and systemd read the same way; every other line stops the start with the file and the line number, and never with
 * the value, because the file holds secrets.
 */
class EnvFileReaderTest {

	@TempDir
	Path tmp;

	@Test
	void readGivesTheEntriesWhenALineIsKeyEqualsValue() throws IOException {
		Path file = envFile("""
				OC_MONGO_PASSWORD=s3cret
				OC_EMPTY=
				SERVER_PORT=9191
				""");

		assertThat(EnvFileReader.read(file)).containsExactly(entry("OC_MONGO_PASSWORD", "s3cret"),
				entry("OC_EMPTY", ""), entry("SERVER_PORT", "9191"));
	}

	@Test
	void readKeepsTheEscapedCharactersWhenAValueIsQuoted() throws IOException {
		Path file = envFile("""
				OC_A="two words"
				OC_B="a\\$b\\`c\\\\d\\"e"
				OC_C="Abc&123;p#ss 'single' ~(x)*?[]{}<>|!"
				""");

		assertThat(EnvFileReader.read(file)).containsExactly(entry("OC_A", "two words"),
				entry("OC_B", "a$b`c\\d\"e"), entry("OC_C", "Abc&123;p#ss 'single' ~(x)*?[]{}<>|!"));
	}

	@Test
	void readSkipsCommentsAndEmptyLines() throws IOException {
		// Spaces and tabs in an empty line or before a comment carry no value, and the shell skips them too.
		Path file = envFile("""
				# Written by OpenCelium setup.

				OC_MONGO_PASSWORD=s3cret
				   \t
				  # a note of the operator
				""");

		assertThat(EnvFileReader.read(file)).containsExactly(entry("OC_MONGO_PASSWORD", "s3cret"));
	}

	@Test
	void readStopsWithTheLineNumberWhenALineEndsWithACarriageReturn() throws IOException {
		// After an edit on Windows the shell would read "s3cret\r": the start does not guess another value.
		Path file = envFile("# header\r\nOC_A=s3cret\r\n");

		assertThatExceptionOfType(EnvFileException.class).isThrownBy(() -> EnvFileReader.read(file))
				.withMessageContaining("line 2").withMessageNotContaining("s3cret");
	}

	@Test
	void readStopsWithTheLineNumberWhenALineHasExport() throws IOException {
		Path file = envFile("""
				# header
				export OC_MONGO_PASSWORD=s3cret
				""");

		assertThatExceptionOfType(EnvFileException.class).isThrownBy(() -> EnvFileReader.read(file))
				.withMessageContaining(file.toString()).withMessageContaining("line 2")
				.satisfies(failure -> assertThat(failure.line()).contains(2))
				.satisfies(failure -> assertThat(failure.file()).isEqualTo(file));
	}

	@Test
	void readStopsWithTheLineNumberWhenALineHasNoEqualsSign() throws IOException {
		Path file = envFile("""
				OC_A=1
				OC_B
				""");

		assertThatExceptionOfType(EnvFileException.class).isThrownBy(() -> EnvFileReader.read(file))
				.withMessageContaining(file.toString()).withMessageContaining("line 2");
	}

	@Test
	void readNeverShowsTheValueWhenALineIsBad() throws IOException {
		List<String> badLines = List.of("OC_A='p4ss-single'", "OC_A=\"p4ss-unterminated", "OC_A=p4ss with spaces",
				"OC_A=\"p4ss\\q\"", "OC_A=p4ss$HOME", "OC_A=\"p4ss\"trailing", "OC_A=\"p4ss\"x\"", "OC_A=\"p4ss$x\"",
				"OC-A=p4ss", "p4ss");
		for (String line : badLines) {
			Path file = envFile("# header\n" + line + "\n");

			assertThatExceptionOfType(EnvFileException.class).as(line).isThrownBy(() -> EnvFileReader.read(file))
					.withMessageContaining("line 2").withMessageNotContaining("p4ss")
					.satisfies(failure -> assertThat(failure.action()).doesNotContain("p4ss"));
		}
	}

	@Test
	void readStopsNamingTheFileWhenItHoldsTheMasterKey() throws IOException {
		Path file = envFile("""
				OC_MONGO_PASSWORD=s3cret
				OC_MASTER_KEY=k3yMaterial
				""");

		assertThatExceptionOfType(EnvFileException.class).isThrownBy(() -> EnvFileReader.read(file))
				.withMessageContaining(file.toString()).withMessageContaining("line 2")
				.withMessageContaining("OC_MASTER_KEY").withMessageNotContaining("k3yMaterial")
				.withMessageNotContaining("s3cret");
	}

	@Test
	void readStopsNamingTheFileWhenTheFileCannotBeRead() throws IOException {
		Path directory = Files.createDirectory(tmp.resolve("opencelium.env"));

		assertThatExceptionOfType(EnvFileException.class).isThrownBy(() -> EnvFileReader.read(directory))
				.withMessageContaining(directory.toString())
				.satisfies(failure -> assertThat(failure.line()).isEmpty());
	}

	private Path envFile(String content) throws IOException {
		return Files.writeString(tmp.resolve("opencelium.env"), content);
	}

}

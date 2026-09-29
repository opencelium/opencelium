package io.opencelium.core.secrets.keys;

import java.nio.file.FileAlreadyExistsException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class RootKeyGeneratorTest {

	@TempDir
	Path dir;

	@Test
	void generateWritesTheBase64Of32BytesAndReturnsAGeneratedKey() throws Exception {
		Path file = dir.resolve("master.key");

		RootKey key = new RootKeyGenerator().generate(file);

		assertThat(Base64.getDecoder().decode(Files.readString(file).strip())).hasSize(32);
		assertThat(key.source()).isEqualTo(RootKeySource.GENERATED);
		assertThat(key.id()).isEqualTo(RootKey.INITIAL_ID);
	}

	@Test
	void generateProducesADifferentKeyEachTime() throws Exception {
		var generator = new RootKeyGenerator();

		generator.generate(dir.resolve("a.key"));
		generator.generate(dir.resolve("b.key"));

		assertThat(Files.readString(dir.resolve("a.key"))).isNotEqualTo(Files.readString(dir.resolve("b.key")));
	}

	@Test
	void generateCreatesTheFileReadableByItsOwnerOnly() throws Exception {
		assumeTrue(FileSystems.getDefault().supportedFileAttributeViews().contains("posix"), "POSIX file system");
		Path file = dir.resolve("master.key");

		new RootKeyGenerator().generate(file);

		assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(file))).isEqualTo("rw-------");
	}

	@Test
	void generateTakesItsBytesFromTheGivenSecureRandom() throws Exception {
		var random = new RecordingSecureRandom();
		Path file = dir.resolve("master.key");

		new RootKeyGenerator(random).generate(file);

		assertThat(random.calls).isEqualTo(1);
		byte[] expected = new byte[32];
		Arrays.fill(expected, (byte) 42);
		assertThat(Files.readString(file)).isEqualTo(Base64.getEncoder().encodeToString(expected));
	}

	@Test
	void generateNeverOverwritesAnExistingFile() throws Exception {
		Path file = Files.writeString(dir.resolve("master.key"), "existing");

		assertThatExceptionOfType(FileAlreadyExistsException.class)
				.isThrownBy(() -> new RootKeyGenerator().generate(file));
		assertThat(Files.readString(file)).isEqualTo("existing");
	}

	/** Fills every request with 42 and counts the calls. */
	private static final class RecordingSecureRandom extends SecureRandom {

		int calls;

		@Override
		public void nextBytes(byte[] bytes) {
			calls++;
			Arrays.fill(bytes, (byte) 42);
		}

	}

}

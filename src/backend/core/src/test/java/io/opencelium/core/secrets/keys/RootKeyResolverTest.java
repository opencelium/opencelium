package io.opencelium.core.secrets.keys;

import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.config.BootstrapPropertyException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class RootKeyResolverTest {

	@TempDir
	Path dataDir;

	@TempDir
	Path elsewhere;

	@Test
	void resolveUsesTheEnvironmentVariableWhenOnlyItIsSet() {
		RootKey key = resolver(Map.of("OC_MASTER_KEY", randomKey()), Optional.empty()).resolve();

		assertThat(key.source()).isEqualTo(RootKeySource.ENV);
		assertThat(key.id()).isEqualTo("k-01");
	}

	@Test
	void resolveUsesTheMasterKeyFileWhenOnlyThePropertyIsSet() throws Exception {
		Path file = Files.writeString(elsewhere.resolve("oc.key"), randomKey() + "\n");

		RootKey key = resolver(Map.of(), Optional.of(file)).resolve();

		assertThat(key.source()).isEqualTo(RootKeySource.FILE);
	}

	@Test
	void resolveUsesTheDataDirFileWhenNothingElseIsSet() throws Exception {
		Files.writeString(dataDir.resolve("master.key"), randomKey());

		RootKey key = resolver(Map.of(), Optional.empty()).resolve();

		assertThat(key.source()).isEqualTo(RootKeySource.DATA_DIR);
	}

	@Test
	void resolvePrefersTheEnvironmentVariableOverTheDataDirFile() throws Exception {
		Files.writeString(dataDir.resolve("master.key"), randomKey());

		RootKey key = resolver(Map.of("OC_MASTER_KEY", randomKey()), Optional.empty()).resolve();

		assertThat(key.source()).isEqualTo(RootKeySource.ENV);
	}

	@Test
	void resolveStopsNamingTheFilePropertyWhenTheVariableAndThePropertyAreBothSet() throws Exception {
		Path file = Files.writeString(elsewhere.resolve("oc.key"), randomKey());
		var resolver = resolver(Map.of("OC_MASTER_KEY", randomKey()), Optional.of(file));

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve())
				.withMessageContaining("Both OC_MASTER_KEY and opencelium.master-key-file are set")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("opencelium.master-key-file"));
	}

	@Test
	void resolveStopsWithTheLengthWhenTheEnvironmentKeyIsNot32Bytes() {
		String shortKey = Base64.getEncoder().encodeToString(new byte[16]);
		var resolver = resolver(Map.of("OC_MASTER_KEY", shortKey), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve())
				.withMessageContaining("OC_MASTER_KEY decodes to 16 bytes, expected 32")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("OC_MASTER_KEY"))
				.satisfies(ex -> assertThat(ex.action()).hasValueSatisfying(
						action -> assertThat(action).contains("openssl rand -base64 32")));
	}

	@Test
	void resolveStopsWithoutQuotingTheValueWhenTheEnvironmentKeyIsNotBase64() {
		var resolver = resolver(Map.of("OC_MASTER_KEY", "secret-value-with-dashes!"), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve())
				.withMessageContaining("OC_MASTER_KEY is not valid base64").withNoCause()
				.satisfies(ex -> assertThat(ex.getMessage()).doesNotContain("secret").doesNotContain("-"));
	}

	@Test
	void resolveStopsWhenTheEnvironmentVariableIsEmpty() {
		var resolver = resolver(Map.of("OC_MASTER_KEY", ""), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve())
				.withMessageContaining("OC_MASTER_KEY is empty");
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void resolveStopsNamingThePropertyWhenTheMasterKeyFileDoesNotExist() {
		Path missing = elsewhere.resolve("missing.key");
		var resolver = resolver(Map.of(), Optional.of(missing));

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve())
				.withMessageContaining(missing + " does not exist")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("opencelium.master-key-file"));
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void resolveStopsNamingTheDataDirWhenTheDataDirFileIsMalformed() throws Exception {
		Path file = Files.writeString(dataDir.resolve("master.key"), Base64.getEncoder().encodeToString(new byte[31]));
		var resolver = resolver(Map.of(), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve())
				.withMessageContaining(file + " decodes to 31 bytes, expected 32")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("opencelium.data-dir"))
				.satisfies(ex -> assertThat(ex.action()).hasValueSatisfying(
						action -> assertThat(action).startsWith("Restore " + file)));
	}

	@Test
	void resolveGeneratesAKeyIntoTheDataDirOnAFreshInstall() throws Exception {
		RootKey generated = resolver(Map.of(), Optional.empty()).resolve();

		Path file = dataDir.resolve("master.key");
		assertThat(generated.source()).isEqualTo(RootKeySource.GENERATED);
		assertThat(Base64.getDecoder().decode(Files.readString(file).strip())).hasSize(32);
		if (FileSystems.getDefault().supportedFileAttributeViews().contains("posix")) {
			assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(file))).isEqualTo("rw-------");
		}
		// The next start loads the same key from the file.
		RootKey reloaded = resolver(Map.of(), Optional.empty()).resolve();
		assertThat(reloaded.source()).isEqualTo(RootKeySource.DATA_DIR);
		assertThat(reloaded.secretKey().getEncoded()).isEqualTo(generated.secretKey().getEncoded());
	}

	private RootKeyResolver resolver(Map<String, String> environment, Optional<Path> masterKeyFile) {
		return new RootKeyResolver(environment::get, masterKeyFile, dataDir, new RootKeyGenerator());
	}

	private static String randomKey() {
		byte[] key = new byte[32];
		new SecureRandom().nextBytes(key);
		return Base64.getEncoder().encodeToString(key);
	}

}

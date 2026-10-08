package io.opencelium.core.secrets.keys;

import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.function.BooleanSupplier;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.DeploymentMode;

import static io.opencelium.core.secrets.keys.RootKeyResolver.DATA_DIR_FILE_NAME;
import static io.opencelium.core.secrets.keys.RootKeyResolver.ENV_VARIABLE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class RootKeyResolverTest {

	private static final BooleanSupplier NO_DATA_KEYS = () -> false;

	private static final BooleanSupplier DATA_KEYS_EXIST = () -> true;

	private static final BooleanSupplier MUST_NOT_ASK = () -> {
		throw new AssertionError("the database must not be asked in this case");
	};

	@TempDir
	Path dataDir;

	@TempDir
	Path elsewhere;

	@Test
	void resolveUsesTheEnvironmentVariableWhenOnlyItIsSet() {
		RootKey key = resolver(Map.of(ENV_VARIABLE, randomKey()), Optional.empty()).resolve(MUST_NOT_ASK);

		assertThat(key.source()).isEqualTo(RootKeySource.ENV);
		assertThat(key.id()).isEqualTo("k-01");
	}

	@Test
	void resolveUsesTheMasterKeyFileWhenOnlyThePropertyIsSet() throws Exception {
		Path file = Files.writeString(elsewhere.resolve("oc.key"), randomKey() + "\n");

		RootKey key = resolver(Map.of(), Optional.of(file)).resolve(MUST_NOT_ASK);

		assertThat(key.source()).isEqualTo(RootKeySource.FILE);
	}

	@Test
	void resolveUsesTheDataDirFileWhenNothingElseIsSet() throws Exception {
		Files.writeString(dataDir.resolve(DATA_DIR_FILE_NAME), randomKey());

		RootKey key = resolver(Map.of(), Optional.empty()).resolve(MUST_NOT_ASK);

		assertThat(key.source()).isEqualTo(RootKeySource.DATA_DIR);
	}

	@Test
	void resolvePrefersTheEnvironmentVariableOverTheDataDirFile() throws Exception {
		Files.writeString(dataDir.resolve(DATA_DIR_FILE_NAME), randomKey());

		RootKey key = resolver(Map.of(ENV_VARIABLE, randomKey()), Optional.empty()).resolve(MUST_NOT_ASK);

		assertThat(key.source()).isEqualTo(RootKeySource.ENV);
	}

	@Test
	void resolveStopsNamingTheFilePropertyWhenTheVariableAndThePropertyAreBothSet() throws Exception {
		Path file = Files.writeString(elsewhere.resolve("oc.key"), randomKey());
		var resolver = resolver(Map.of(ENV_VARIABLE, randomKey()), Optional.of(file));

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve(MUST_NOT_ASK))
				.withMessageContaining("Both OC_MASTER_KEY and opencelium.master-key-file are set")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("opencelium.master-key-file"));
	}

	@Test
	void resolveStopsWithTheLengthWhenTheEnvironmentKeyIsNot32Bytes() {
		String shortKey = Base64.getEncoder().encodeToString(new byte[16]);
		var resolver = resolver(Map.of(ENV_VARIABLE, shortKey), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve(MUST_NOT_ASK))
				.withMessageContaining("OC_MASTER_KEY decodes to 16 bytes, expected 32")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("OC_MASTER_KEY"))
				.satisfies(ex -> assertThat(ex.action()).hasValueSatisfying(
						action -> assertThat(action).contains("openssl rand -base64 32")));
	}

	@Test
	void resolveStopsWithoutQuotingTheValueWhenTheEnvironmentKeyIsNotBase64() {
		var resolver = resolver(Map.of(ENV_VARIABLE, "secret-value-with-dashes!"), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve(MUST_NOT_ASK))
				.withMessageContaining("OC_MASTER_KEY is not valid base64").withNoCause()
				.satisfies(ex -> assertThat(ex.getMessage()).doesNotContain("secret").doesNotContain("-"));
	}

	@Test
	void resolveStopsWhenTheEnvironmentVariableIsEmpty() {
		var resolver = resolver(Map.of(ENV_VARIABLE, ""), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve(MUST_NOT_ASK))
				.withMessageContaining("OC_MASTER_KEY is empty");
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void resolveStopsNamingThePropertyWhenTheMasterKeyFileDoesNotExist() {
		Path missing = elsewhere.resolve("missing.key");
		var resolver = resolver(Map.of(), Optional.of(missing));

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve(MUST_NOT_ASK))
				.withMessageContaining(missing + " does not exist")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("opencelium.master-key-file"));
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void resolveStopsNamingTheDataDirWhenTheDataDirFileIsMalformed() throws Exception {
		Path file = Files.writeString(dataDir.resolve(DATA_DIR_FILE_NAME),
				Base64.getEncoder().encodeToString(new byte[31]));
		var resolver = resolver(Map.of(), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve(MUST_NOT_ASK))
				.withMessageContaining(file + " decodes to 31 bytes, expected 32")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("opencelium.data-dir"))
				.satisfies(ex -> assertThat(ex.action()).hasValueSatisfying(
						action -> assertThat(action).startsWith("Restore " + file)));
	}

	@Test
	void resolveGeneratesAKeyIntoTheDataDirOnAFreshSelfHostInstall() throws Exception {
		RootKey generated = resolver(Map.of(), Optional.empty()).resolve(NO_DATA_KEYS);

		Path file = dataDir.resolve("master.key");
		assertThat(generated.source()).isEqualTo(RootKeySource.GENERATED);
		assertThat(Base64.getDecoder().decode(Files.readString(file).strip())).hasSize(32);
		if (FileSystems.getDefault().supportedFileAttributeViews().contains("posix")) {
			assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(file))).isEqualTo("rw-------");
		}
		// The next start loads the same key from the file.
		RootKey reloaded = resolver(Map.of(), Optional.empty()).resolve(MUST_NOT_ASK);
		assertThat(reloaded.source()).isEqualTo(RootKeySource.DATA_DIR);
		assertThat(reloaded.secretKey().getEncoded()).isEqualTo(generated.secretKey().getEncoded());
	}

	@Test
	void resolveStopsNamingTheFilePropertyInCloudModeWhenNoSourceHasAKey() {
		var resolver = cloudResolver(Map.of(), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve(NO_DATA_KEYS))
				.withMessageContaining("No master key was found")
				.withMessageContaining("In cloud mode no key is generated")
				.satisfies(ex -> assertThat(ex.propertyName()).isEqualTo("opencelium.master-key-file"))
				.satisfies(ex -> assertThat(ex.action()).hasValueSatisfying(
						action -> assertThat(action).contains("OC_MASTER_KEY").contains("opencelium.master-key-file")
								.contains("openssl rand -base64 32")));
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void resolveStopsInCloudModeWithoutAskingWhetherDataKeysExist() {
		var resolver = cloudResolver(Map.of(), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver.resolve(MUST_NOT_ASK));
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void resolveReadsTheDataDirFileInCloudModeWhenItExists() throws Exception {
		Files.writeString(dataDir.resolve(DATA_DIR_FILE_NAME), randomKey());

		RootKey key = cloudResolver(Map.of(), Optional.empty()).resolve(MUST_NOT_ASK);

		assertThat(key.source()).isEqualTo(RootKeySource.DATA_DIR);
	}

	@Test
	void resolveStopsWithRestoreOrResetAndWritesNoFileWhenDataKeysExist() {
		var resolver = resolver(Map.of(), Optional.empty());

		assertThatExceptionOfType(KeyStartupException.class).isThrownBy(() -> resolver.resolve(DATA_KEYS_EXIST))
				.withMessageStartingWith(KeyStartupException.RESTORE_OR_RESET)
				.withMessageContaining("No master key was found");
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	private RootKeyResolver resolver(Map<String, String> environment, Optional<Path> masterKeyFile) {
		return resolver(DeploymentMode.SELF_HOST, environment, masterKeyFile);
	}

	private RootKeyResolver cloudResolver(Map<String, String> environment, Optional<Path> masterKeyFile) {
		return resolver(DeploymentMode.CLOUD, environment, masterKeyFile);
	}

	private RootKeyResolver resolver(DeploymentMode mode, Map<String, String> environment,
			Optional<Path> masterKeyFile) {
		return new RootKeyResolver(mode, environment::get, masterKeyFile, dataDir, new RootKeyGenerator());
	}

	private static String randomKey() {
		byte[] key = new byte[32];
		new SecureRandom().nextBytes(key);
		return Base64.getEncoder().encodeToString(key);
	}

}

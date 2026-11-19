package io.opencelium.core.testsupport;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.function.Supplier;

import org.springframework.test.context.DynamicPropertyRegistry;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.secrets.keys.RootKeyResolver;

/**
 * A {@link MongoIntegrationTest} in the cloud mode: the database of the test class is the system database, and the
 * data directory holds a new master key file, because the cloud mode generates no master key. The key file is in the
 * data directory and not in {@code opencelium.master-key-file}, so an {@code OC_MASTER_KEY} in the shell of the
 * developer does not stop the start. Usage as for {@link LocalMongo#register}:
 * <pre>{@code
 * @DynamicPropertySource
 * static void properties(DynamicPropertyRegistry registry) {
 *     CloudStart.register(registry, MyCloudTest.class, () -> dataDir);
 * }
 * }</pre>
 */
public final class CloudStart {

	private CloudStart() {
	}

	public static void register(DynamicPropertyRegistry registry, Class<?> testClass, Supplier<Path> dataDir) {
		LocalMongo.register(registry, testClass, () -> withMasterKey(dataDir.get()));
		registry.add(OpenCeliumProperties.DEPLOYMENT_MODE, DeploymentMode.CLOUD::propertyValue);
	}

	private static Path withMasterKey(Path dataDir) {
		Path keyFile = dataDir.resolve(RootKeyResolver.DATA_DIR_FILE_NAME);
		if (Files.notExists(keyFile)) {
			byte[] key = new byte[32];
			new SecureRandom().nextBytes(key);
			try {
				Files.writeString(keyFile, Base64.getEncoder().encodeToString(key), StandardCharsets.US_ASCII);
			}
			catch (IOException ex) {
				throw new UncheckedIOException(ex);
			}
		}
		return dataDir;
	}

}

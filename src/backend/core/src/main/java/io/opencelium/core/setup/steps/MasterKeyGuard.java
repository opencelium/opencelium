package io.opencelium.core.setup.steps;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;

import com.mongodb.MongoException;

import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.secrets.keys.KeyStartupException;
import io.opencelium.core.secrets.keys.RootKeyGenerator;
import io.opencelium.core.secrets.keys.RootKeyResolver;
import io.opencelium.core.secrets.keys.RootKeySource;
import io.opencelium.core.secrets.keys.WrappedDekProbe;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.values.EnvironmentSnapshot;

/**
 * The check before the master key menu. A master key that a source holds in a bad form stops the setup, because the
 * start would refuse it. When the database already holds encrypted data keys, only the master key that encrypted
 * them can read them, so the setup must find that key and never offer a new one. Without it the setup stops with the
 * restore-or-reset text. A database that does not answer stops the setup too, because the setup cannot tell whether
 * a new key is safe. The guard looks for the master key where the start looks: {@code OC_MASTER_KEY} and
 * {@code OPENCELIUM_MASTERKEYFILE} of the environment of the setup, then {@code master.key} of the data directory.
 */
public final class MasterKeyGuard {

	private final Function<MongoConnection, Optional<String>> ping;

	private final Predicate<MongoConnection> wrappedDeksExist;

	public MasterKeyGuard() {
		this(new MongoStartupPing()::check, WrappedDekProbe::existsAny);
	}

	/**
	 * @param ping             the cause why MongoDB at a connection cannot be used; empty when it answers
	 * @param wrappedDeksExist whether the database of a connection holds encrypted data keys
	 */
	public MasterKeyGuard(Function<MongoConnection, Optional<String>> ping,
			Predicate<MongoConnection> wrappedDeksExist) {
		this.ping = Objects.requireNonNull(ping, "ping");
		this.wrappedDeksExist = Objects.requireNonNull(wrappedDeksExist, "wrappedDeksExist");
	}

	/**
	 * @param connection  the MongoDB connection that the MongoDB step chose
	 * @param dataDir     the data directory that the data directory step chose
	 * @param environment the environment variables of the setup, which the start reads too
	 * @return whether the database holds encrypted data keys; then a master key is found, and the step must not
	 *         offer to generate one
	 * @throws SetupFailedException with exit code 1 when the database does not answer, and when it holds encrypted
	 *                              data keys but no master key is found, or a found master key is in a bad form
	 */
	public boolean run(MongoConnection connection, Path dataDir, EnvironmentSnapshot environment) {
		ping.apply(connection).ifPresent(cause -> {
			throw unreadable(connection, cause);
		});
		Optional<RootKeySource> found = probe(dataDir, environment);
		boolean dataKeys;
		try {
			dataKeys = wrappedDeksExist.test(connection);
		}
		catch (MongoException ex) {
			// Not the driver's message: it can quote the connection string.
			throw unreadable(connection, ex.getClass().getSimpleName());
		}
		if (dataKeys && found.isEmpty()) {
			Path dataDirKey = dataDir.resolve(RootKeyResolver.DATA_DIR_FILE_NAME);
			throw SetupFailedException.failure(KeyStartupException.RESTORE_OR_RESET, "", "MongoDB at "
					+ connection.redacted() + " holds encrypted data keys, but no master key was found: "
					+ RootKeyResolver.ENV_VARIABLE + " is not set, and " + dataDirKey + " does not exist. Set "
					+ RootKeyResolver.ENV_VARIABLE + " to the original master key, or copy the original key file to "
					+ dataDirKey + ", also when this installation named the key file in its configuration. Then run the"
					+ " setup again. The setup generates no new master key: a new key cannot read the stored secrets.");
		}
		return dataKeys;
	}

	/** Where the start would find the master key, without a generation; a key in a bad form stops the setup. */
	private static Optional<RootKeySource> probe(Path dataDir, EnvironmentSnapshot environment) {
		Optional<Path> keyFile = environment.value(OpenCeliumProperties.MASTER_KEY_FILE)
				.map(value -> Path.of(value.text()));
		try {
			return new RootKeyResolver(DeploymentMode.SELF_HOST, name -> environment.text(name).orElse(null),
					keyFile, dataDir, new RootKeyGenerator()).probe();
		}
		catch (BootstrapPropertyException ex) {
			throw SetupFailedException.failure(ex.getMessage() + ex.action().map(action -> " " + action).orElse(""));
		}
	}

	private static SetupFailedException unreadable(MongoConnection connection, String cause) {
		return SetupFailedException.failure("Cannot read MongoDB at " + connection.redacted() + ": " + cause
				+ ". The master key step must know whether the database holds encrypted data keys. Start MongoDB or"
				+ " correct the URI, then run the setup again.");
	}

}

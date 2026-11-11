package io.opencelium.core.setup.steps;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.secrets.keys.WrappedDekProbe;

/**
 * The check before the master key menu. A master key that a source holds in a bad form stops the setup, because the
 * start would refuse it. When the database already holds encrypted data keys, only the master key that encrypted
 * them can read them, so the setup must find that key and never offer a new one. Without it the setup stops with the
 * restore-or-reset text. A database that does not answer stops the setup too, because the setup cannot tell whether
 * a new key is safe.
 */
public final class MasterKeyGuard {

	private final Function<MongoConnection, Optional<String>> ping;

	private final Predicate<MongoConnection> wrappedDeksExist;

	private final Function<String, String> environment;

	public MasterKeyGuard() {
		this(new MongoStartupPing()::check, WrappedDekProbe::existsAny, System::getenv);
	}

	/**
	 * @param ping             the cause why MongoDB at a connection cannot be used; empty when it answers
	 * @param wrappedDeksExist whether the database of a connection holds encrypted data keys
	 * @param environment      looks up the environment variables of this process
	 */
	public MasterKeyGuard(Function<MongoConnection, Optional<String>> ping, Predicate<MongoConnection> wrappedDeksExist,
			Function<String, String> environment) {
		this.ping = Objects.requireNonNull(ping, "ping");
		this.wrappedDeksExist = Objects.requireNonNull(wrappedDeksExist, "wrappedDeksExist");
		this.environment = Objects.requireNonNull(environment, "environment");
	}

	/**
	 * @param mongoUri the URI that the MongoDB step chose
	 * @param dataDir  the data directory that the data directory step chose
	 * @return whether the database holds encrypted data keys; then a master key is found, and the step must not
	 *         offer to generate one
	 * @throws io.opencelium.core.setup.SetupFailedException with exit code 1 when the database does not answer, and
	 *                                                       when it holds encrypted data keys but no master key is
	 *                                                       found, or a found master key is in a bad form
	 */
	public boolean run(String mongoUri, Path dataDir) {
		throw new UnsupportedOperationException("run");
	}

}

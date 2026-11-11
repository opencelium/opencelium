package io.opencelium.core.setup.steps;

import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.function.Function;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.Question;

/**
 * Where the master key comes from. The master key is the root of the encryption of the stored credentials, so the
 * step first says why it matters, then offers to generate a new key into the data directory, to use the variable
 * {@code OC_MASTER_KEY}, or to read a key file. A key that the data directory holds already is kept, never
 * replaced: a new key could not read what the old one encrypted. Before the menu the guard makes sure that the
 * database holds no encrypted data keys without their key.
 */
public final class MasterKeyStep implements SetupStep {

	private final MasterKeyGuard guard;

	private final Function<String, String> environment;

	private final Consumer<String> standardError;

	private final Path home;

	public MasterKeyStep() {
		this(new MasterKeyGuard(), System::getenv, System.err::println, Path.of(System.getProperty("user.home")));
	}

	/**
	 * @param environment   looks up the environment variables of this process
	 * @param standardError where the backup warning goes in batch mode, one line at a time
	 * @param home          the home directory for a typed {@code ~}
	 */
	public MasterKeyStep(MasterKeyGuard guard, Function<String, String> environment, Consumer<String> standardError,
			Path home) {
		this.guard = Objects.requireNonNull(guard, "guard");
		this.environment = Objects.requireNonNull(environment, "environment");
		this.standardError = Objects.requireNonNull(standardError, "standardError");
		this.home = Objects.requireNonNull(home, "home").toAbsolutePath().normalize();
	}

	@Override
	public List<Question> questions() {
		throw new UnsupportedOperationException("questions");
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		throw new UnsupportedOperationException("run");
	}

}

package io.opencelium.core.setup;

import java.nio.file.Path;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Objects;
import java.util.Optional;
import java.util.OptionalInt;
import java.util.SequencedMap;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.setup.files.FilePlan;

/**
 * What the wizard knows so far: where the values come from, the answers of the steps that ran, and the files and the
 * actions that the steps planned from them. Each step takes its value through the source, reads what earlier steps
 * stored, and stores its own answer. Nothing here touches the disk; the wizard carries out the plan after the last
 * step.
 */
public final class SetupContext {

	/**
	 * The wizard installs the self-host mode only. The cloud mode needs a hand-written configuration and is set up
	 * by the consulting service, not by this wizard.
	 */
	public static final DeploymentMode DEPLOYMENT_MODE = DeploymentMode.SELF_HOST;

	private final ValueSource values;

	private final FilePlan filePlan = new FilePlan();

	private Path dataDir;

	private Integer port;

	private String mongoUri;

	private final SequencedMap<String, String> environment = new LinkedHashMap<>();

	/** Every question is asked. */
	public SetupContext() {
		this(ValueSource.PROMPTED);
	}

	public SetupContext(ValueSource values) {
		this.values = Objects.requireNonNull(values, "values");
	}

	/** Where a step gets its value: the setup file, else the prompter. */
	public ValueSource values() {
		return values;
	}

	public DeploymentMode deploymentMode() {
		return DEPLOYMENT_MODE;
	}

	/** The answer of the data directory step, absolute; empty before it ran. */
	public Optional<Path> dataDir() {
		return Optional.ofNullable(dataDir);
	}

	public void setDataDir(Path dataDir) {
		this.dataDir = dataDir;
	}

	/** The answer of the port step; empty before it ran. */
	public OptionalInt port() {
		return port == null ? OptionalInt.empty() : OptionalInt.of(port);
	}

	public void setPort(int port) {
		this.port = port;
	}

	/**
	 * The answer of the MongoDB step as application.yml will hold it: with the placeholder of a password that the env
	 * file holds; empty before the step ran.
	 */
	public Optional<String> mongoUri() {
		return Optional.ofNullable(mongoUri);
	}

	public void setMongoUri(String mongoUri) {
		this.mongoUri = mongoUri;
	}

	/** The entries of the env file, in the order the steps added them: the secrets application.yml names. */
	public SequencedMap<String, String> environment() {
		return Collections.unmodifiableSequencedMap(environment);
	}

	/** Adds an entry to the env file, or replaces the value of a name that a step added before. */
	public void putEnvironment(String name, String value) {
		environment.put(Objects.requireNonNull(name, "name"), Objects.requireNonNull(value, "value"));
	}

	/**
	 * The files to write and the actions to run after the summary: a step adds what it needs, and the summary adds
	 * application.yml and the env file when it is confirmed. After a cancel the wizard carries out nothing of it.
	 */
	public FilePlan filePlan() {
		return filePlan;
	}

}

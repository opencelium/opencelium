package io.opencelium.core.setup;

import java.nio.file.Path;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.OptionalInt;
import java.util.SequencedMap;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
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

	/**
	 * The admin password of the first admin, from the admin step or the default admin. The product fixes it, with no
	 * forced change: the admin logs in right after the first start and changes it in the browser. The console shows
	 * it; a log never does.
	 */
	public static final String FIRST_ADMIN_PASSWORD = "1234";

	/** The default of the admin step, and the admin that a start without the wizard makes on an empty database. */
	public static final String DEFAULT_ADMIN_USERNAME = "admin";

	/** The path of the admin login page in the browser, which the login box and the log name. */
	public static final String LOGIN_PAGE = "/login";

	private final ValueSource values;

	private final FilePlan filePlan = new FilePlan();

	private Path dataDir;

	private Integer port;

	private String mongoUri;

	private MongoConnection mongoConnection;

	private List<String> mongoVariables = List.of();

	private String masterKeySource;

	private Path masterKeyFile;

	private String masterKeyVariable;

	private String adminUsername;

	private final SequencedMap<String, String> environment = new LinkedHashMap<>();

	/** Every question is asked. */
	public SetupContext() {
		this(ValueSource.PROMPTED);
	}

	public SetupContext(ValueSource values) {
		this.values = Objects.requireNonNull(values, "values");
	}

	/** Where a step gets its value: the environment, else the setup file, else the prompter. */
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
	 * The whole URI that the MongoDB step chose, which the env file will hold; empty before the step ran, and empty
	 * when environment variables give the connection.
	 */
	public Optional<String> mongoUri() {
		return Optional.ofNullable(mongoUri);
	}

	/** The URI of a server that the user chose; it replaces a connection from the environment. */
	public void setMongoUri(String mongoUri) {
		this.mongoUri = mongoUri;
		this.mongoConnection = null;
		this.mongoVariables = List.of();
	}

	/**
	 * The connection that environment variables give. The host-style variables give no URI text, so the step keeps
	 * the connection that the start resolves from them, and no file holds a copy.
	 *
	 * @param connection the MongoDB connection that environment variables give
	 * @param variables  the names of these variables
	 */
	public void setMongoConnection(MongoConnection connection, List<String> variables) {
		this.mongoConnection = Objects.requireNonNull(connection, "connection");
		this.mongoVariables = List.copyOf(variables);
		this.mongoUri = null;
	}

	/**
	 * The MongoDB connection that the MongoDB step chose: from the environment, or from the URI that the user chose.
	 * The master key step, the admin step and the admin marker use its database, which the first start uses too.
	 *
	 * @throws SetupFailedException  with exit code 1 when the start would not accept the chosen URI
	 * @throws IllegalStateException when the MongoDB step did not run
	 */
	public MongoConnection mongoConnection() {
		if (mongoConnection != null) {
			return mongoConnection;
		}
		if (mongoUri == null) {
			throw new IllegalStateException("The MongoDB step did not run.");
		}
		try {
			return StaticMongoConnectionResolver.parseUri(mongoUri);
		}
		catch (BootstrapPropertyException ex) {
			// Each parse of a mongodb+srv URI reads DNS, so it can fail here after the step accepted the URI.
			throw SetupFailedException.failure(ex.getMessage());
		}
	}

	/** The variables that give the MongoDB connection, in the order of the result line; empty for a chosen URI. */
	public List<String> mongoVariables() {
		return mongoVariables;
	}

	/** Where the master key comes from, in words for the summary; empty before the master key step ran. */
	public Optional<String> masterKeySource() {
		return Optional.ofNullable(masterKeySource);
	}

	/** The key file that the user named, absolute, which application.yml will name; empty for the other sources. */
	public Optional<Path> masterKeyFile() {
		return Optional.ofNullable(masterKeyFile);
	}

	/**
	 * @param source where the master key comes from, in words for the summary
	 * @param file   the key file that the user named, absolute; empty for the other sources
	 */
	public void setMasterKey(String source, Optional<Path> file) {
		this.masterKeySource = Objects.requireNonNull(source, "source");
		this.masterKeyFile = file.orElse(null);
		this.masterKeyVariable = null;
	}

	/**
	 * The master key that an environment variable gives, itself or as its key file. application.yml then names no key
	 * file, so the variable stays the only source.
	 *
	 * @param source   where the master key comes from, in words for the summary
	 * @param variable the environment variable that gives the master key or its key file
	 */
	public void setMasterKeyFromVariable(String source, String variable) {
		this.masterKeySource = Objects.requireNonNull(source, "source");
		this.masterKeyFile = null;
		this.masterKeyVariable = Objects.requireNonNull(variable, "variable");
	}

	/** The variable that gives the master key or its key file; empty for the other sources. */
	public Optional<String> masterKeyVariable() {
		return Optional.ofNullable(masterKeyVariable);
	}

	/** The username of the admin that the start makes; empty when the admin step did not run or did not apply. */
	public Optional<String> adminUsername() {
		return Optional.ofNullable(adminUsername);
	}

	public void setAdminUsername(String adminUsername) {
		this.adminUsername = Objects.requireNonNull(adminUsername, "adminUsername");
	}

	/**
	 * The bootstrap properties that an environment variable gives, with the name of the variable, in the order of
	 * the summary: the deployment mode, the data directory, the port. The steps take these values from the variables,
	 * so the files hold no line and no entry for them, and the summary tells to keep each variable.
	 */
	public SequencedMap<String, String> fromEnvironment() {
		var found = new LinkedHashMap<String, String>();
		for (String property : List.of(OpenCeliumProperties.DEPLOYMENT_MODE, OpenCeliumProperties.DATA_DIR,
				BootstrapProperties.SERVER_PORT)) {
			values.environment().value(property).ifPresent(value -> found.put(property, value.variable()));
		}
		return Collections.unmodifiableSequencedMap(found);
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

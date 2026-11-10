package io.opencelium.core.setup.steps;

import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;

import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.mongo.DockerComposeInstaller;
import io.opencelium.core.setup.mongo.MongoDetection;
import io.opencelium.core.setup.mongo.MongoDetector;
import io.opencelium.core.setup.mongo.UriSplitter;
import io.opencelium.core.setup.prompt.Choice;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.Question;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.user.GeneratedPasswords;

/**
 * Where OpenCelium finds MongoDB. When a server listens on localhost:27017, that server is the first option and the
 * default. Otherwise Docker Compose is, when the host has it: a new MongoDB in a container, with a generated password
 * that goes to the env file. The step only plans it; the container starts after the summary, as an action of the
 * plan. Docker Compose is not offered next to a local server, because its container publishes the same port. The
 * user can also type the URI of a server that exists, or exit. Each server that exists is pinged with the start
 * ping of the application before the step continues, so a wrong address or login shows now, with the cause that the
 * start would name. A failed ping offers to type the URI again, to keep it, or to go back to the menu. A password in
 * the URI moves to the env file, and application.yml refers to it by its placeholder; plain text in application.yml
 * needs a second answer after a warning. In batch mode the password always moves. The step makes and starts
 * nothing: the ping only reads.
 * <p>
 * In the setup file, {@code mongo} is {@code local}, {@code docker} or {@code uri}, and {@code mongo-uri} is the URI
 * for {@code uri}. A server of the file that does not answer stops the setup, as each bad value of the file does, and
 * so does {@code docker} on a host where the menu would not offer it.
 */
public final class MongoStep implements SetupStep {

	static final String QUESTION = "Which MongoDB does OpenCelium use?";

	static final String RETRY_QUESTION = "What now?";

	static final String MOVE_QUESTION = "Move the password to the env file?";

	static final String PLAIN_TEXT_QUESTION = "Write the password into application.yml?";

	private static final String LOCAL = "local";

	private static final String DOCKER = "docker";

	private static final String URI = "uri";

	private static final String SERVER_HELP = """
			Which MongoDB OpenCelium uses:
			  local   the server that listens on %s on this machine, without a login
			  docker  a new server in a Docker container, started with Docker Compose after the summary;
			          the setup generates its password
			  uri     a server that exists; mongo-uri gives its URI""";

	private static final String URI_HELP = """
			The connection URI, for example mongodb://user:password@db.example:27017/opencelium. The path names
			the database; without one OpenCelium uses opencelium. URL-encode @ : / ? # [ ] % and spaces in the
			user name and the password. The setup pings the server before it continues.""";

	private static final String MOVE_HELP = """
			y: the env file opencelium.env holds the password, readable by its owner only, and application.yml
			   refers to it as ${OC_MONGO_PASSWORD}.
			n: application.yml holds the password in plain text.""";

	private static final String PLAIN_TEXT_HELP = """
			y writes the password in plain text into application.yml.
			n asks again where the password goes.""";

	private static final String PLAIN_TEXT_WARNING = "application.yml is readable by its group: each member of the"
			+ " group could read the password.";

	private static final List<Choice> RETRY = List.of(
			new Choice("Type the URI again", "correct the address or the login", "Type the URI again; the setup pings"
					+ " it again."),
			new Choice("Continue", "keep this URI", "Keep this URI. OpenCelium does not start until the server answers;"
					+ " the start names the cause again."),
			new Choice("Back to the menu", "choose another MongoDB", "Go back to the list of MongoDB servers."));

	private enum Server { LOCAL, DOCKER, URI, EXIT }

	/** What the user chose: a server to connect to, or a new one that Docker Compose starts. */
	private sealed interface Answer {

		record Connect(String uri) implements Answer {

			/** Without the password of the URI. */
			@Override
			public String toString() {
				return "Connect[" + MongoConnection.redact(uri) + "]";
			}

		}

		record StartDockerCompose() implements Answer {
		}

	}

	private static final Answer START_DOCKER_COMPOSE = new Answer.StartDockerCompose();

	private final GeneratedPasswords passwords = new GeneratedPasswords();

	private final MongoDetector detector;

	private final Function<MongoConnection, Optional<String>> ping;

	private final DockerComposeInstaller dockerCompose;

	/**
	 * @param quickstartDirectory where the Docker Compose option writes its files
	 */
	public MongoStep(Path quickstartDirectory) {
		this(new MongoDetector(), new MongoStartupPing()::check, new DockerComposeInstaller(quickstartDirectory));
	}

	/**
	 * @param ping          the cause why MongoDB at a connection cannot be used; empty when it answers and accepts the
	 *                      login
	 * @param dockerCompose plans the start of MongoDB with Docker Compose
	 */
	MongoStep(MongoDetector detector, Function<MongoConnection, Optional<String>> ping,
			DockerComposeInstaller dockerCompose) {
		this.detector = Objects.requireNonNull(detector, "detector");
		this.ping = Objects.requireNonNull(ping, "ping");
		this.dockerCompose = Objects.requireNonNull(dockerCompose, "dockerCompose");
	}

	/**
	 * @param ping the cause why MongoDB at a connection cannot be used; empty when it answers and accepts the login
	 */
	MongoStep(MongoDetector detector, Function<MongoConnection, Optional<String>> ping) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

	@Override
	public List<Question> questions() {
		return List.of(serverQuestion(servers(detector.detect())), uriQuestion());
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		List<Server> servers = servers(detector.detect());
		ValueSource values = context.values();
		Optional<Answer> fromFile = values.given(serverQuestion(servers), word -> checkWord(word, servers),
				UnaryOperator.identity(), prompter).flatMap(word -> switch (word) {
					case LOCAL -> Optional.of(connect(detector.localUri()));
					case DOCKER -> Optional.of(START_DOCKER_COMPOSE);
					default -> uriOption(values, prompter).map(MongoStep::connect);
				});
		switch (fromFile.orElseGet(() -> fromMenu(servers, values, prompter))) {
			case Answer.Connect(String uri) -> store(uri, context, prompter);
			case Answer.StartDockerCompose _ -> planDockerCompose(context, prompter);
		}
	}

	/** The menu: a local server first; else Docker Compose when the host has it; then the URI and the exit. */
	private static List<Server> servers(MongoDetection detection) {
		if (detection.localServer()) {
			return List.of(Server.LOCAL, Server.URI, Server.EXIT);
		}
		if (detection.dockerCompose()) {
			return List.of(Server.DOCKER, Server.URI, Server.EXIT);
		}
		return List.of(Server.URI, Server.EXIT);
	}

	private Answer fromMenu(List<Server> servers, ValueSource values, Prompter prompter) {
		List<Choice> choices = servers.stream().map(this::choice).toList();
		while (true) {
			Optional<Answer> answer = switch (servers.get(prompter.choice(QUESTION, choices, 0))) {
				case LOCAL -> accepted(detector.localUri(), prompter).map(MongoStep::connect);
				case DOCKER -> Optional.of(START_DOCKER_COMPOSE);
				case URI -> uriOption(values, prompter).map(MongoStep::connect);
				case EXIT -> throw new SetupCancelledException();
			};
			if (answer.isPresent()) {
				return answer.get();
			}
		}
	}

	private static Answer connect(String uri) {
		return new Answer.Connect(uri);
	}

	/**
	 * Generates the password now, so that the env file and the .env of the container get the same value; the action
	 * writes nothing and starts nothing before the summary.
	 */
	private void planDockerCompose(SetupContext context, Prompter prompter) {
		char[] generated = passwords.next();
		String password = new String(generated);
		Arrays.fill(generated, '\0');
		context.setMongoUri(DockerComposeInstaller.URI);
		context.putEnvironment(UriSplitter.PASSWORD_VARIABLE, password);
		context.filePlan().add(dockerCompose.install(password, prompter));
	}

	/** The URI of the URI option: from the file, pinged; else typed and pinged. Empty: back to the menu. */
	private Optional<String> uriOption(ValueSource values, Prompter prompter) {
		Optional<String> fromFile = values.given(uriQuestion(), value -> syntax(value).or(() -> problem(value)),
				MongoConnection::redact, prompter);
		return fromFile.isPresent() ? fromFile : accepted(askUri(prompter), prompter);
	}

	/** Pings {@code uri} until it answers or the user keeps it; empty when the user goes back to the menu. */
	private Optional<String> accepted(String uri, Prompter prompter) {
		String current = uri;
		while (true) {
			prompter.progress("Pinging MongoDB at " + MongoConnection.redact(current) + "...");
			Optional<String> problem = problem(current);
			if (problem.isEmpty()) {
				prompter.success("MongoDB answers at " + MongoConnection.redact(current));
				return Optional.of(current);
			}
			prompter.error(problem.get());
			switch (prompter.choice(RETRY_QUESTION, RETRY, 0)) {
				case 0 -> current = askUri(prompter);
				case 1 -> {
					prompter.info("OpenCelium does not start until MongoDB at " + MongoConnection.redact(current)
							+ " answers.");
					return Optional.of(current);
				}
				default -> {
					return Optional.empty();
				}
			}
		}
	}

	private String askUri(Prompter prompter) {
		Question question = uriQuestion();
		return prompter.text(question.label(), question.help(), question.defaultValue(), MongoStep::syntax);
	}

	/**
	 * The problem with {@code word} as the {@code mongo} value of the file: {@code local} must answer, and
	 * {@code docker} must be on the menu of this host.
	 */
	private Optional<String> checkWord(String word, List<Server> servers) {
		return switch (word) {
			case LOCAL -> problem(detector.localUri());
			case DOCKER -> servers.contains(Server.DOCKER) ? Optional.empty()
					: Optional.of(servers.contains(Server.LOCAL)
							? "A server listens on " + detector.address() + ", and the container of Docker Compose"
									+ " needs that port."
							: "Docker Compose is not available on this host: docker compose version failed.");
			case URI -> Optional.empty();
			default -> Optional.of("'" + word + "' is not one of: " + LOCAL + ", " + DOCKER + ", " + URI + ".");
		};
	}

	/** Why the start would not accept {@code uri}, or empty; the message never shows the password. */
	private static Optional<String> syntax(String uri) {
		try {
			StaticMongoConnectionResolver.parseUri(uri);
			return Optional.empty();
		}
		catch (BootstrapPropertyException ex) {
			return Optional.of(ex.getMessage());
		}
	}

	/** Why MongoDB at {@code uri} cannot be used, as the start would say it; empty when it answers. */
	private Optional<String> problem(String uri) {
		MongoConnection connection;
		try {
			connection = StaticMongoConnectionResolver.parseUri(uri);
		}
		catch (BootstrapPropertyException ex) {
			// Each parse of a mongodb+srv URI reads DNS, so it can fail here after an earlier parse passed.
			return Optional.of(ex.getMessage());
		}
		return ping.apply(connection).map(cause -> "Cannot use MongoDB at " + connection.redacted() + ": " + cause
				+ ".");
	}

	/** A password moves to the env file unless the user confirms plain text after the warning. */
	private static void store(String uri, SetupContext context, Prompter prompter) {
		UriSplitter.SplitUri split = UriSplitter.split(uri);
		if (split.password().isPresent() && passwordToEnvFile(context.values(), prompter)) {
			context.setMongoUri(split.uri());
			context.putEnvironment(UriSplitter.PASSWORD_VARIABLE, split.password().get());
		}
		else {
			context.setMongoUri(uri);
		}
	}

	private static boolean passwordToEnvFile(ValueSource values, Prompter prompter) {
		while (true) {
			if (values.yesNo(MOVE_QUESTION, MOVE_HELP, true, prompter)) {
				return true;
			}
			prompter.error(PLAIN_TEXT_WARNING);
			if (prompter.yesNo(PLAIN_TEXT_QUESTION, PLAIN_TEXT_HELP, false)) {
				return false;
			}
		}
	}

	private Question serverQuestion(List<Server> servers) {
		String defaultWord = switch (servers.getFirst()) {
			case LOCAL -> LOCAL;
			case DOCKER -> DOCKER;
			case URI, EXIT -> URI;
		};
		return new Question(ValueKey.MONGO, "MongoDB", SERVER_HELP.formatted(detector.address()), defaultWord);
	}

	private Question uriQuestion() {
		return new Question(ValueKey.MONGO_URI, "MongoDB URI", URI_HELP, detector.localUri());
	}

	private Choice choice(Server server) {
		return switch (server) {
			case LOCAL -> new Choice("Local server", "the server at " + detector.address(), "Use the MongoDB that"
					+ " listens on " + detector.address() + " on this machine, database opencelium, without a login.");
			case DOCKER -> new Choice("Docker Compose", "start MongoDB in a container on this machine", "Start a new"
					+ " MongoDB in a Docker container after the summary, on 127.0.0.1:27017, with a generated password."
					+ " The data stays in the Docker volume opencelium_mongo-data.");
			case URI -> new Choice("Server URI", "type the URI of a server that exists", "Type the connection URI of"
					+ " a MongoDB server that exists, with its login. The setup pings it before it continues.");
			case EXIT -> new Choice("Exit", "end the setup; nothing is written", "End the setup; nothing is written."
					+ " Start MongoDB, then run the setup again.");
		};
	}

}

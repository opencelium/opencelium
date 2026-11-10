package io.opencelium.core.setup.steps;

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
import io.opencelium.core.setup.mongo.MongoDetector;
import io.opencelium.core.setup.prompt.Choice;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.Question;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.values.ValueSource;

/**
 * Where OpenCelium finds MongoDB. The setup connects to a server that exists and never starts one, so a server that
 * also holds the data of other applications stays as it is. When a server listens on localhost:27017, that server is
 * the first option and the default. The user can also type the URI of a server that exists, or exit. Each server is
 * pinged with the start ping of the application before the step continues, so a wrong address or login shows now,
 * with the cause that the start would name. A failed ping offers to type the URI again, to keep it, or to go back to
 * the menu. The step keeps the whole URI, a database password included, and asks nothing about it: the summary puts
 * the URI into the env file, and application.yml refers to it. The step makes and starts nothing: the ping only
 * reads.
 * <p>
 * In the setup file, {@code mongo} is {@code local} or {@code uri}, and {@code mongo-uri} is the URI for {@code uri}.
 * A server of the file that does not answer stops the setup, as each bad value of the file does. A bad value is
 * shown masked, because a URI under the wrong key holds a database password.
 */
public final class MongoStep implements SetupStep {

	static final String QUESTION = "Which MongoDB does OpenCelium use?";

	static final String RETRY_QUESTION = "What now?";

	private static final String LOCAL = "local";

	private static final String URI = "uri";

	private static final String SERVER_HELP = """
			Which MongoDB OpenCelium uses:
			  local   the server that listens on %s on this machine, without a login
			  uri     a server that exists; mongo-uri gives its URI""";

	private static final String URI_HELP = """
			The connection URI, for example
			  mongodb://opencelium:<database password>@db.example:27017/opencelium?authSource=admin
			The path names the database; without one OpenCelium uses opencelium. authSource names the database
			that holds the database user, often admin. Give OpenCelium its own database user with the readWrite
			role on its database, not the root user. Percent-encode @ : / ? # [ ] % and the space in the
			database username and the database password. The setup pings the server before it continues.""";

	private static final List<Choice> RETRY = List.of(
			new Choice("Type the URI again", "correct the address or the login", "Type the URI again; the setup pings"
					+ " it again."),
			new Choice("Continue", "keep this URI", "Keep this URI. OpenCelium does not start until the server answers;"
					+ " the start names the cause again."),
			new Choice("Back to the menu", "choose another MongoDB", "Go back to the list of MongoDB servers."));

	private enum Server { LOCAL, URI, EXIT }

	private final MongoDetector detector;

	private final Function<MongoConnection, Optional<String>> ping;

	public MongoStep() {
		this(new MongoDetector(), new MongoStartupPing()::check);
	}

	/**
	 * @param ping the cause why MongoDB at a connection cannot be used; empty when it answers and accepts the login
	 */
	MongoStep(MongoDetector detector, Function<MongoConnection, Optional<String>> ping) {
		this.detector = Objects.requireNonNull(detector, "detector");
		this.ping = Objects.requireNonNull(ping, "ping");
	}

	@Override
	public List<Question> questions() {
		return List.of(serverQuestion(servers(detector.localServerListens())), uriQuestion());
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		List<Server> servers = servers(detector.localServerListens());
		ValueSource values = context.values();
		Optional<String> fromFile = values.given(serverQuestion(servers), this::checkWord, UnaryOperator.identity(),
				prompter).flatMap(word -> word.equals(LOCAL) ? Optional.of(detector.localUri())
						: uriOption(values, prompter));
		context.setMongoUri(fromFile.orElseGet(() -> fromMenu(servers, values, prompter)));
	}

	/** The menu: a local server first, when one listens; then the URI and the exit. */
	private static List<Server> servers(boolean localServer) {
		return localServer ? List.of(Server.LOCAL, Server.URI, Server.EXIT) : List.of(Server.URI, Server.EXIT);
	}

	/** The URI of the server that the user chose: it answered, or the user kept it after a failed ping. */
	private String fromMenu(List<Server> servers, ValueSource values, Prompter prompter) {
		List<Choice> choices = servers.stream().map(this::choice).toList();
		while (true) {
			Optional<String> uri = switch (servers.get(prompter.choice(QUESTION, choices, 0))) {
				case LOCAL -> accepted(detector.localUri(), prompter);
				case URI -> uriOption(values, prompter);
				case EXIT -> throw new SetupCancelledException();
			};
			if (uri.isPresent()) {
				return uri.get();
			}
		}
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
	 * The problem with {@code word} as the {@code mongo} value of the file: {@code local} must answer. The message
	 * masks the word, because a URI under this key holds a database password.
	 */
	private Optional<String> checkWord(String word) {
		return switch (word) {
			case LOCAL -> problem(detector.localUri());
			case URI -> Optional.empty();
			default -> Optional.of("'" + MongoConnection.redact(word) + "' is not one of: " + LOCAL + ", " + URI + ".");
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

	private Question serverQuestion(List<Server> servers) {
		String defaultWord = servers.getFirst() == Server.LOCAL ? LOCAL : URI;
		return new Question(ValueKey.MONGO, "MongoDB", SERVER_HELP.formatted(detector.address()), defaultWord);
	}

	private Question uriQuestion() {
		return new Question(ValueKey.MONGO_URI, "MongoDB URI", URI_HELP, detector.localUri());
	}

	private Choice choice(Server server) {
		return switch (server) {
			case LOCAL -> new Choice("Local server", "the server at " + detector.address(), "Use the MongoDB that"
					+ " listens on " + detector.address() + " on this machine, database opencelium, without a login.");
			case URI -> new Choice("Server URI", "type the URI of a server that exists", "Type the connection URI of"
					+ " a MongoDB server that exists, with its login. The setup pings it before it continues.");
			case EXIT -> new Choice("Exit", "end the setup; nothing is written", "End the setup; nothing is written."
					+ " Start MongoDB, then run the setup again.");
		};
	}

}

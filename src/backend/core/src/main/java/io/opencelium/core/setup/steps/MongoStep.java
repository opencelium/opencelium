package io.opencelium.core.setup.steps;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.regex.Pattern;

import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.mongo.MongoDetector;
import io.opencelium.core.setup.mongo.UriBuilder;
import io.opencelium.core.setup.prompt.Choice;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.Question;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.values.ValueSource;

/**
 * Where OpenCelium finds MongoDB. The setup connects to a server that exists and never starts one, so a server that
 * also holds the data of other applications stays as it is. When a server listens on localhost:27017, that server is
 * the first option and the default. The user can also type the URI of a server that exists, type the values of that
 * URI one by one, or exit. The values are for a user who knows the server and the database login but not the form of
 * a URI: the step asks the host, the port, the database and the database username and, with a database username, the
 * database password and the database that holds the database user. It checks each answer at its question, so a wrong
 * port shows there, and builds the URI. Each server is pinged with the start ping of the application before the step
 * continues, so a wrong address or login shows now, with the cause that the start would name. A failed ping offers
 * to type the answer again, to keep it, or to go back to the menu. The step keeps the whole URI, a database password
 * included, and asks nothing about it: the summary puts the URI into the env file, and application.yml refers to it.
 * The step makes and starts nothing: the ping only reads.
 * <p>
 * In the setup file, {@code mongo} is {@code local} or {@code uri}, and {@code mongo-uri} is the URI for {@code uri}.
 * The values have no key there: the file gives the whole URI. A server of the file that does not answer stops the
 * setup, as each bad value of the file does. A bad value is shown masked, because a URI under the wrong key holds a
 * database password.
 */
public final class MongoStep implements SetupStep {

	/**
	 * Asks how, not which: the URI option and the values option can name the same server, so the options are ways to
	 * give the MongoDB connection, and only the local option names a server.
	 */
	static final String QUESTION = "How do you want to connect OpenCelium to MongoDB?";

	static final String RETRY_QUESTION = "What now?";

	private static final String LOCAL = "local";

	private static final String URI = "uri";

	private static final String SERVER_HELP = """
			How OpenCelium connects to MongoDB:
			  local   the server that listens on %s on this machine, without a database login
			  uri     a server that exists; mongo-uri gives its URI""";

	private static final String URI_HELP = """
			The connection URI, for example
			  mongodb://opencelium:<database password>@db.example:27017/opencelium?authSource=admin
			The path names the database; without one OpenCelium uses opencelium. authSource names the database
			that holds the database user, often admin. Give OpenCelium its own database user with the readWrite
			role on its database, not the root user. Percent-encode @ : / ? # [ ] % and the space in the
			database username and the database password. The setup pings the server before it continues.""";

	private static final String HOST_HELP = """
			The host name or the IP address of the MongoDB server, without the port, for example db.example or
			192.0.2.10. Write an IPv6 address in square brackets, for example [::1].""";

	private static final String PORT_HELP = "The port that the MongoDB server listens on; MongoDB uses 27017 when"
			+ " nothing else is set.";

	private static final String DATABASE_HELP = """
			The database that OpenCelium uses on the server; MongoDB makes it at the first write. The name can hold
			A-Z, a-z, 0-9, - and _. A database with another name needs the whole URI.""";

	private static final String USERNAME_HELP = """
			The database user that OpenCelium logs in with. Give OpenCelium its own database user with the readWrite
			role on its database, not the root user. When the brackets are empty, Enter means that the server needs
			no database login.""";

	private static final String AUTH_DATABASE_HELP = "The database that holds the database user, often admin.";

	private static final String DEFAULT_AUTH_DATABASE = "admin";

	private static final String PORT_PROBLEM = "Please enter a port number between 1 and 65535.";

	/** A host name, an IPv4 address, or an IPv6 address in square brackets: no port and no part of a URI. */
	private static final Pattern HOST = Pattern.compile("[A-Za-z0-9._-]+|\\[[0-9A-Fa-f:.]+]");

	private static final Pattern PORT = Pattern.compile("[0-9]{1,5}");

	/**
	 * Narrower than the names that MongoDB permits: each of these characters keeps its meaning in the path and in an
	 * option of a URI, so the name goes into the URI as typed.
	 */
	private static final Pattern DATABASE_NAME = Pattern.compile("[A-Za-z0-9_-]+");

	private static final List<Choice> RETRY_URI = retry("Type the URI again", "correct the address or the database"
			+ " login", "Type the URI again; the setup pings it again.");

	private static final List<Choice> RETRY_VALUES = retry("Type the values again", "correct the address or the"
			+ " database login", "Type the values again; the last answers are the defaults, except the database"
					+ " password. The setup pings the server again.");

	private enum Server { LOCAL, URI, VALUES, EXIT }

	/** What follows a ping: the step uses the URI, asks the answer again, or shows the menu again. */
	private enum AfterPing { USE, AGAIN, BACK }

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
	public String name() {
		return "MongoDB";
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

	/** The menu: a local server first, when one listens; then the URI, the values and the exit. */
	private static List<Server> servers(boolean localServer) {
		return localServer ? List.of(Server.LOCAL, Server.URI, Server.VALUES, Server.EXIT)
				: List.of(Server.URI, Server.VALUES, Server.EXIT);
	}

	/** The options after a failed ping; only the first one depends on what the user typed. */
	private static List<Choice> retry(String again, String summary, String help) {
		return List.of(new Choice(again, summary, help),
				new Choice("Continue", "keep this URI", "Keep this URI. The master key step reads this database next, so"
						+ " the setup stops there while the server does not answer."),
				new Choice("Back to the menu", "choose another option", "Go back to the MongoDB menu."));
	}

	/** The URI of the server that the user chose: it answered, or the user kept it after a failed ping. */
	private String fromMenu(List<Server> servers, ValueSource values, Prompter prompter) {
		List<Choice> choices = servers.stream().map(this::choice).toList();
		while (true) {
			Optional<String> uri = switch (servers.get(prompter.choice(QUESTION, choices, 0))) {
				case LOCAL -> accepted(detector.localUri(), prompter);
				case URI -> uriOption(values, prompter);
				case VALUES -> valuesOption(prompter);
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

	/**
	 * The URI of the values option: built from the answers, then pinged. After a failed ping the user can type the
	 * values again, and the last answers are then the defaults, except the database password, which no screen shows.
	 * Empty: back to the menu.
	 */
	private Optional<String> valuesOption(Prompter prompter) {
		String host = MongoDetector.DEFAULT_HOST;
		String port = String.valueOf(MongoDetector.DEFAULT_PORT);
		String database = StaticMongoConnectionResolver.DEFAULT_DATABASE;
		String username = "";
		String authDatabase = DEFAULT_AUTH_DATABASE;
		while (true) {
			host = prompter.text("MongoDB host", HOST_HELP, host, MongoStep::hostProblem);
			port = prompter.text("MongoDB port", PORT_HELP, port, MongoStep::portProblem);
			database = prompter.text("Database", DATABASE_HELP, database, MongoStep::databaseNameProblem);
			username = prompter.text("Database username", USERNAME_HELP, username, answer -> Optional.empty());
			String password = "";
			if (!username.isEmpty()) {
				password = prompter.secret("Database password");
				authDatabase = prompter.text("Authentication database", AUTH_DATABASE_HELP, authDatabase,
						MongoStep::databaseNameProblem);
			}
			String uri = UriBuilder.build(host, port, database, username, password, authDatabase);
			switch (pingAndAsk(uri, RETRY_VALUES, prompter)) {
				case USE -> {
					return Optional.of(uri);
				}
				case BACK -> {
					return Optional.empty();
				}
				case AGAIN -> {
					// The next round asks the values with these answers as the defaults.
				}
			}
		}
	}

	/** Pings {@code uri} until it answers or the user keeps it; empty when the user goes back to the menu. */
	private Optional<String> accepted(String uri, Prompter prompter) {
		String current = uri;
		while (true) {
			switch (pingAndAsk(current, RETRY_URI, prompter)) {
				case USE -> {
					return Optional.of(current);
				}
				case BACK -> {
					return Optional.empty();
				}
				case AGAIN -> current = askUri(prompter);
			}
		}
	}

	/**
	 * Pings {@code uri} once and says the result. After a failed ping the user decides with the retry menu.
	 *
	 * @param retry the options of the retry menu: type the answer again, keep the URI, back to the menu
	 */
	private AfterPing pingAndAsk(String uri, List<Choice> retry, Prompter prompter) {
		prompter.progress("Pinging MongoDB at " + MongoConnection.redact(uri) + "...");
		Optional<String> problem = problem(uri);
		if (problem.isEmpty()) {
			prompter.success("MongoDB answers at " + MongoConnection.redact(uri));
			return AfterPing.USE;
		}
		prompter.error(problem.get());
		return switch (prompter.choice(RETRY_QUESTION, retry, 0)) {
			case 0 -> AfterPing.AGAIN;
			case 1 -> {
				prompter.info("OpenCelium does not start until MongoDB at " + MongoConnection.redact(uri)
						+ " answers.");
				yield AfterPing.USE;
			}
			default -> AfterPing.BACK;
		};
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

	/**
	 * The problem with {@code host} as the host of the values option. The message masks the answer, because a URI
	 * that a user types here by mistake holds a database password.
	 */
	private static Optional<String> hostProblem(String host) {
		return HOST.matcher(host).matches() ? Optional.empty()
				: Optional.of("'" + MongoConnection.redact(host) + "' is not a host name or an IP address. The port has"
						+ " its own question, and an IPv6 address needs square brackets.");
	}

	/** The problem with {@code port} as the port of the values option: only digits, from 1 to 65535. */
	private static Optional<String> portProblem(String port) {
		if (PORT.matcher(port).matches()) {
			int number = Integer.parseInt(port);
			if (number >= 1 && number <= 65535) {
				return Optional.empty();
			}
		}
		return Optional.of(PORT_PROBLEM);
	}

	/** The problem with {@code name} as a database name of the values option; the message masks it as the host. */
	private static Optional<String> databaseNameProblem(String name) {
		return DATABASE_NAME.matcher(name).matches() ? Optional.empty()
				: Optional.of("'" + MongoConnection.redact(name) + "' is not a database name here: use A-Z, a-z, 0-9,"
						+ " - and _ only.");
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
			case LOCAL -> new Choice("Local MongoDB", "the server at " + detector.address() + ", no database login",
					"Use the MongoDB that listens on " + detector.address() + " on this machine, database opencelium,"
							+ " without a database login.");
			case URI -> new Choice("MongoDB URI", "type the whole URI with the database login", "Type the"
					+ " connection URI of a MongoDB server that exists, with its database login. The setup pings it"
					+ " before it continues.");
			case VALUES -> new Choice("Step by step", "type the host, the port, the database and the database login",
					"Type the host, the port, the database and the database login of a MongoDB server that exists, one"
							+ " by one. The setup builds the URI from them and pings the server before it continues.");
			case EXIT -> new Choice("Exit", "end the setup; nothing is written", "End the setup; nothing is written."
					+ " Start MongoDB, then run the setup again.");
		};
	}

}

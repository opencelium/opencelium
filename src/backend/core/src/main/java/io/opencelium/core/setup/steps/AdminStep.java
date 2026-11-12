package io.opencelium.core.setup.steps;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Predicate;

import com.mongodb.MongoException;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.setup.AdminMarker;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.Question;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.user.AdminLookup;

/**
 * The first admin: the step asks the admin username and plans the admin marker, which the start turns into the admin
 * with the fixed first admin password. The step asks no admin password. When the database of the MongoDB step holds
 * an admin already, the step does not apply: the setup makes no second admin, and the admin keeps the admin
 * password it has.
 */
public final class AdminStep implements SetupStep {

	private static final String HELP = "The username of the first admin. The admin password is "
			+ SetupContext.FIRST_ADMIN_PASSWORD + ": log in with it at " + SetupContext.LOGIN_PAGE
			+ " after the start, then change it in the browser. The setup asks no admin password.";

	private final Predicate<MongoConnection> adminExists;

	/** Asks the database of the MongoDB step for an admin of the self-host tenant. */
	public AdminStep() {
		this(connection -> AdminLookup.exists(connection, TenantId.SELF_HOST));
	}

	/**
	 * @param adminExists whether the database of a connection holds an admin of the self-host tenant
	 */
	public AdminStep(Predicate<MongoConnection> adminExists) {
		this.adminExists = Objects.requireNonNull(adminExists, "adminExists");
	}

	@Override
	public String name() {
		return "Admin account";
	}

	@Override
	public List<Question> questions() {
		return List.of(question());
	}

	private static Question question() {
		return new Question(ValueKey.ADMIN_USERNAME, "Admin username", HELP, SetupContext.DEFAULT_ADMIN_USERNAME);
	}

	/**
	 * @throws SetupFailedException with exit code 1 when MongoDB does not answer: the step cannot tell whether an
	 *                              admin exists
	 */
	@Override
	public boolean applicable(SetupContext context) {
		MongoConnection connection = connection(context);
		try {
			return !adminExists.test(connection);
		}
		catch (MongoException ex) {
			// Not the driver's message: it can quote the connection string.
			throw SetupFailedException.failure("Cannot read MongoDB at " + connection.redacted() + ": "
					+ ex.getClass().getSimpleName() + ". The admin step must know whether an admin exists. Start"
					+ " MongoDB or correct the URI, then run the setup again.");
		}
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		String username = context.values().text(question(), AdminStep::check, prompter);
		context.setAdminUsername(username);
		context.filePlan().add(new AdminMarker(connection(context), username));
	}

	/**
	 * The problem with {@code value} as the admin username, or empty when it is one. A control character is refused
	 * too: the username shows in the summary, the login box and the log, where it could steer the terminal.
	 */
	static Optional<String> check(String value) {
		return value.codePoints().anyMatch(c -> Character.isWhitespace(c) || Character.isISOControl(c))
				? Optional.of("An admin username has no spaces and no control characters.") : Optional.empty();
	}

	private static MongoConnection connection(SetupContext context) {
		return StaticMongoConnectionResolver.parseUri(context.mongoUri()
				.orElseThrow(() -> new IllegalStateException("The MongoDB step did not run.")));
	}

}

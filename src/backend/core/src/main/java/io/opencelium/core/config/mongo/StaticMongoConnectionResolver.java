package io.opencelium.core.config.mongo;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.mongodb.ConnectionString;
import com.mongodb.MongoConfigurationException;
import com.mongodb.MongoNamespace;
import org.bson.UuidRepresentation;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.mongodb.autoconfigure.MongoProperties;
import org.springframework.boot.mongodb.autoconfigure.PropertiesMongoConnectionDetails;
import org.springframework.core.env.Environment;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.EnvFileEnvironmentPostProcessor;
import io.opencelium.core.config.OpenCeliumProperties;

import static io.opencelium.core.config.BootstrapProperties.MONGODB_AUTHENTICATION_DATABASE;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_DATABASE;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_HOST;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_PASSWORD;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_URI;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_USERNAME;
import static io.opencelium.core.config.BootstrapProperties.mongoAddressPropertiesSet;

/**
 * Resolves to the one database configured under {@code spring.mongodb.*}: the tenant's database in self mode, the
 * system database in cloud mode. Reads Boot's standard properties, either the URI or {@code host}/{@code port}/
 * {@code username}/..., but never lets Boot's {@code localhost/test} fallback apply, and rejects every setting Boot
 * or this class would otherwise silently ignore.
 */
public final class StaticMongoConnectionResolver implements MongoConnectionResolver {

	/** The database when the URI has no path and {@code spring.mongodb.database} is not set. */
	public static final String DEFAULT_DATABASE = "opencelium";

	/** Spring resolves each placeholder that it can, so a {@code ${} that is left has no value. */
	private static final String PLACEHOLDER_START = "${";

	/**
	 * The placeholder that the setup wizard writes: the whole URI is {@code ${NAME}}. The name is then safe to show.
	 */
	private static final Pattern URI_PLACEHOLDER = Pattern.compile("^\\$\\{([A-Za-z_][A-Za-z0-9_]*)}$");

	/**
	 * A placeholder for the whole password of the user information, as a yml file written by hand can hold it. Only
	 * then is the name safe to show; any other {@code ${} can be a part of a password.
	 */
	private static final Pattern PASSWORD_PLACEHOLDER = Pattern.compile(
			"^mongodb(?:\\+srv)?://[^:/?@]+:\\$\\{([A-Za-z_][A-Za-z0-9_]*)}@[^/?@]*(?:[/?].*)?$", Pattern.DOTALL);

	private static final String ENCODING_HINT = "check the format mongodb://user:password@host:port/database?options"
			+ " and URL-encode special characters (@ : / ? # [ ] % space) in the user name and password";

	private final DeploymentMode mode;

	private final MongoConnection connection;

	private StaticMongoConnectionResolver(DeploymentMode mode, MongoConnection connection) {
		this.mode = mode;
		this.connection = connection;
	}

	public static StaticMongoConnectionResolver from(OpenCeliumProperties properties, Environment environment) {
		DeploymentMode mode = properties.deploymentMode();
		MongoProperties mongo = bind(Binder.get(environment));
		rejectConnectionOptionProperties(mongo);
		List<String> addressProperties = mongoAddressPropertiesSet(mongo);
		if (mongo.getUri() != null) {
			if (!addressProperties.isEmpty()) {
				String names = String.join(", ", addressProperties);
				throw new BootstrapPropertyException(addressProperties.getFirst(),
						"Set either " + MONGODB_URI + " or " + names + ", not both: with a URI, Boot ignores "
								+ (addressProperties.size() == 1 ? "it" : "them") + ".",
						"Remove " + names + ", or remove " + MONGODB_URI
								+ " and describe the server with the spring.mongodb.host/port/username/... properties only.",
						null);
			}
			if (mongo.getUri().contains(PLACEHOLDER_START)) {
				throw unresolvedPlaceholder(mongo.getUri(), PlaceholderLookup.atStart(environment));
			}
			return new StaticMongoConnectionResolver(mode, fromUri(mongo));
		}
		// Without a URI: cloud needs an explicit host; self-host accepts any host-style setting
		// (host defaults to localhost).
		if (mode.mongoUriHasDefault() ? addressProperties.isEmpty() : mongo.getHost() == null) {
			throw new BootstrapPropertyException(MONGODB_URI, mode.mongoUriHasDefault()
					? MONGODB_URI + " is not set and no default was applied."
					: mode.propertyValue() + " mode requires the system database URI explicitly;"
							+ " no default is applied in " + mode.propertyValue() + " mode.");
		}
		return new StaticMongoConnectionResolver(mode, fromHostProperties(mongo, addressProperties));
	}

	/**
	 * The connection of a URI with the rules that the start applies to {@code spring.mongodb.uri}, without an
	 * environment: the database is the path of the URI, else {@code opencelium}. The setup wizard checks a typed URI
	 * with it, so a URI that the wizard accepts is one that the start accepts.
	 *
	 * @throws BootstrapPropertyException when the URI is not valid; the message never shows a password
	 */
	public static MongoConnection parseUri(String uri) {
		return fromUri(uri, null);
	}

	private static MongoProperties bind(Binder binder) {
		var mongo = new MongoProperties();
		if (!binder.bind(MONGODB_URI, String.class).isBound()) {
			// Without a URI Boot builds one and would put "test" into its path, which is also where the login is
			// checked unless authentication-database is set. Our default goes in first; a configured one replaces it.
			mongo.setDatabase(DEFAULT_DATABASE);
		}
		binder.bind("spring.mongodb", Bindable.ofInstance(mongo));
		return mongo;
	}

	/** Boot applies these through its client customizer, which is excluded; the URI options do the same job. */
	private static void rejectConnectionOptionProperties(MongoProperties mongo) {
		if (mongo.getSsl().getBundle() != null) {
			throw unsupported("spring.mongodb.ssl.bundle", "tls=true (the JVM trust store is used)");
		}
		if (mongo.getSsl().isEnabled()) {
			throw unsupported("spring.mongodb.ssl.enabled", "tls=true");
		}
		if (mongo.getRepresentation().getUuid() != UuidRepresentation.UNSPECIFIED) {
			throw unsupported("spring.mongodb.representation.uuid", "uuidRepresentation=standard (or javaLegacy, ...)");
		}
	}

	private static BootstrapPropertyException unsupported(String property, String uriOption) {
		return new BootstrapPropertyException(property,
				property + " is not supported: the MongoDB client is configured from the connection string only.",
				"Remove " + property + " and add " + uriOption + " to " + MONGODB_URI
						+ " (a host-style configuration has to move to " + MONGODB_URI + " for this).",
				null);
	}

	private static MongoConnection fromUri(MongoProperties mongo) {
		return fromUri(mongo.getUri(), mongo.getDatabase());
	}

	/**
	 * @param databaseProperty the value of {@code spring.mongodb.database}, which wins over the path; {@code null}
	 *                         when it is not set
	 */
	private static MongoConnection fromUri(String uri, String databaseProperty) {
		if (uri.contains(PLACEHOLDER_START)) {
			throw unresolvedPlaceholder(uri, PlaceholderLookup.PROCESS_ONLY);
		}
		ConnectionString connectionString;
		try {
			connectionString = new ConnectionString(uri);
		}
		catch (IllegalArgumentException ex) {
			// The parser's message can quote parts of the input, so it is shown only when there is nothing to hide.
			boolean secret = MongoConnection.mayContainSecret(uri);
			throw new BootstrapPropertyException(MONGODB_URI, "'" + MongoConnection.maskUnparsed(uri)
					+ "' is not a valid MongoDB connection string: " + (secret ? ENCODING_HINT : ex.getMessage()) + ".",
					null, secret ? null : ex);
		}
		catch (MongoConfigurationException ex) {
			// For mongodb+srv the driver reads the TXT record of the host while it parses; its message names the host.
			throw new BootstrapPropertyException(MONGODB_URI, "'" + MongoConnection.maskUnparsed(uri)
					+ "' cannot be used: " + ex.getMessage() + ".", ex);
		}
		if (connectionString.getUsername() == null && uri.split("\\?", 2)[0].contains("@")) {
			// For example "oc:1234/abc@db": the driver reads host oc, port 1234 and no credentials.
			throw new BootstrapPropertyException(MONGODB_URI, "'" + MongoConnection.maskUnparsed(uri)
					+ "' has an '@' but no user name; the password is probably not URL-encoded: " + ENCODING_HINT + ".");
		}
		if (connectionString.getProxyPassword() != null) {
			throw new BootstrapPropertyException(MONGODB_URI, "proxyPassword in " + MONGODB_URI + " is not supported:"
					+ " the MongoDB Java driver 5.8 logs the proxy password in plain text.");
		}
		boolean fromProperty = databaseProperty != null;
		String database = fromProperty ? databaseProperty
				: connectionString.getDatabase() != null ? connectionString.getDatabase() : DEFAULT_DATABASE;
		validateDatabaseName(database, fromProperty ? MONGODB_DATABASE : MONGODB_URI);
		return new MongoConnection(connectionString, database, MONGODB_URI);
	}

	private static BootstrapPropertyException unresolvedPlaceholder(String uri, PlaceholderLookup lookup) {
		Matcher named = URI_PLACEHOLDER.matcher(uri);
		if (!named.matches()) {
			named = PASSWORD_PLACEHOLDER.matcher(uri);
		}
		if (named.matches()) {
			String variable = named.group(1);
			return new BootstrapPropertyException(MONGODB_URI,
					MONGODB_URI + " refers to " + variable + ", which has no value in " + lookup.lookedIn() + ".",
					lookup.setIn().map(file -> "Add the line " + variable + "=<value> to " + file + ", or set "
							+ variable + " in the environment of the process.").orElse("Set " + variable + "."),
					null);
		}
		return new BootstrapPropertyException(MONGODB_URI, "'" + MongoConnection.maskUnparsed(uri)
				+ "' holds a ${...} placeholder that has no value in " + lookup.lookedIn() + ".",
				"Set the variable that the placeholder names" + lookup.setIn().map(file -> ", in " + file + " or in the"
						+ " environment of the process").orElse("") + ". In a password, URL-encode $ as %24 and { as %7B.",
				null);
	}

	/**
	 * Where a placeholder was looked for, in words for the message, and the env file to put its value in.
	 *
	 * @param lookedIn the sources, for example "the environment of this process or in the env file /etc/x.env"
	 * @param setIn    the env file of this start, also when it does not exist yet; empty outside a start
	 */
	private record PlaceholderLookup(String lookedIn, Optional<String> setIn) {

		/** A URI checked outside a start, for example the one that the setup wizard asks for. */
		static final PlaceholderLookup PROCESS_ONLY = new PlaceholderLookup("the environment of this process",
				Optional.empty());

		/** At the start Spring also resolves from the env file next to the configuration file. */
		static PlaceholderLookup atStart(Environment environment) {
			Optional<Path> envFile = EnvFileEnvironmentPostProcessor.envFile(environment);
			if (envFile.isEmpty()) {
				return new PlaceholderLookup("the environment of this process, and there is no env file, because no"
						+ " configuration file was found", Optional.of(EnvFileEnvironmentPostProcessor.FILE_NAME
								+ " next to application.yml"));
			}
			String file = envFile.get().toString();
			if (Files.exists(envFile.get())) {
				return new PlaceholderLookup("the environment of this process or in the env file " + file,
						Optional.of(file));
			}
			return new PlaceholderLookup("the environment of this process, and there is no env file at " + file,
					Optional.of("a new env file " + file));
		}

	}

	private static MongoConnection fromHostProperties(MongoProperties mongo, List<String> addressProperties) {
		if (mongo.getUsername() == null) {
			// Boot writes the password and authSource only together with a user name.
			if (mongo.getPassword() != null) {
				throw withoutUsername(MONGODB_PASSWORD);
			}
			if (mongo.getAuthenticationDatabase() != null) {
				throw withoutUsername(MONGODB_AUTHENTICATION_DATABASE);
			}
		}
		// Boot encodes the credentials with URLEncoder, which turns a space into '+'; the driver then reads a '+'.
		if (mongo.getUsername() != null && mongo.getUsername().contains(" ")) {
			throw spaceInCredential(MONGODB_USERNAME);
		}
		if (mongo.getPassword() != null && new String(mongo.getPassword()).contains(" ")) {
			throw spaceInCredential(MONGODB_PASSWORD);
		}
		validateDatabaseName(mongo.getDatabase(), MONGODB_DATABASE);
		try {
			// No SslBundles: TLS and bundles are rejected above, so Boot never asks for them.
			var connectionString = new PropertiesMongoConnectionDetails(mongo, null).getConnectionString();
			return new MongoConnection(connectionString, mongo.getDatabase(), MONGODB_HOST);
		}
		catch (IllegalArgumentException ex) {
			boolean secret = mongo.getUsername() != null || mongo.getPassword() != null;
			throw new BootstrapPropertyException(addressProperties.getFirst(),
					"The connection string built from " + String.join(", ", addressProperties) + " is not valid: "
							+ (secret ? ENCODING_HINT : ex.getMessage()) + ".",
					null, secret ? null : ex);
		}
	}

	private static BootstrapPropertyException withoutUsername(String property) {
		return new BootstrapPropertyException(MONGODB_USERNAME,
				property + " is set but " + MONGODB_USERNAME + " is not; Boot ignores it without a user name.",
				"Set " + MONGODB_USERNAME + ", or remove " + property + ".", null);
	}

	private static BootstrapPropertyException spaceInCredential(String property) {
		return new BootstrapPropertyException(property, property + " contains a space, which Spring Boot encodes"
				+ " as '+' when it builds the connection string, so the login would fail.",
				"Remove " + property + " and put the credentials into " + MONGODB_URI
						+ " instead, writing the space as %20.",
				null);
	}

	private static void validateDatabaseName(String database, String property) {
		try {
			MongoNamespace.checkDatabaseNameValidity(database);
		}
		catch (IllegalArgumentException ex) {
			throw new BootstrapPropertyException(property,
					"'" + database + "' is not a valid MongoDB database name: " + ex.getMessage() + ".", ex);
		}
	}

	@Override
	public MongoConnection resolve(TenantId tenant) {
		boolean selfHostedTenant = mode == DeploymentMode.SELF_HOST && tenant.equals(TenantId.SELF_HOST);
		if (tenant.equals(TenantId.SYSTEM) || selfHostedTenant) {
			return connection;
		}
		throw new UnsupportedOperationException("No database for tenant " + tenant + " in " + mode.propertyValue()
				+ " mode: per-tenant routing is not built yet.");
	}

}

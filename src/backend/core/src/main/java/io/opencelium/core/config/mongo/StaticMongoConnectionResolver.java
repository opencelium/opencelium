package io.opencelium.core.config.mongo;

import java.util.List;

import com.mongodb.ConnectionString;
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
 * system database in saas mode. Reads Boot's standard properties, either the URI or {@code host}/{@code port}/
 * {@code username}/..., but never lets Boot's {@code localhost/test} fallback apply, and rejects every setting Boot
 * or this class would otherwise silently ignore.
 */
public final class StaticMongoConnectionResolver implements MongoConnectionResolver {

	static final String DEFAULT_DATABASE = "opencelium";

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
			return new StaticMongoConnectionResolver(mode, fromUri(mongo));
		}
		// Without a URI: saas needs an explicit host; self accepts any host-style setting (host defaults to localhost).
		if (mode.mongoUriHasDefault() ? addressProperties.isEmpty() : mongo.getHost() == null) {
			throw new BootstrapPropertyException(MONGODB_URI, mode.mongoUriHasDefault()
					? MONGODB_URI + " is not set and no default was applied."
					: mode.propertyValue() + " mode requires the system database URI explicitly;"
							+ " no default is applied in " + mode.propertyValue() + " mode.");
		}
		return new StaticMongoConnectionResolver(mode, fromHostProperties(mongo, addressProperties));
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
		String uri = mongo.getUri();
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
		if (connectionString.getUsername() == null && uri.split("\\?", 2)[0].contains("@")) {
			// For example "oc:1234/abc@db": the driver reads host oc, port 1234 and no credentials.
			throw new BootstrapPropertyException(MONGODB_URI, "'" + MongoConnection.maskUnparsed(uri)
					+ "' has an '@' but no user name; the password is probably not URL-encoded: " + ENCODING_HINT + ".");
		}
		if (connectionString.getProxyPassword() != null) {
			throw new BootstrapPropertyException(MONGODB_URI, "proxyPassword in " + MONGODB_URI + " is not supported:"
					+ " the MongoDB Java driver 5.8 logs the proxy password in plain text.");
		}
		boolean fromProperty = mongo.getDatabase() != null;
		String database = fromProperty ? mongo.getDatabase()
				: connectionString.getDatabase() != null ? connectionString.getDatabase() : DEFAULT_DATABASE;
		validateDatabaseName(database, fromProperty ? MONGODB_DATABASE : MONGODB_URI);
		return new MongoConnection(connectionString, database, MONGODB_URI);
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
		if (tenant.equals(TenantId.SYSTEM) || (mode == DeploymentMode.SELF && tenant.equals(TenantId.SELF))) {
			return connection;
		}
		throw new UnsupportedOperationException("No database for tenant " + tenant + " in " + mode.propertyValue()
				+ " mode: per-tenant routing (decision #11) is not built yet.");
	}

}

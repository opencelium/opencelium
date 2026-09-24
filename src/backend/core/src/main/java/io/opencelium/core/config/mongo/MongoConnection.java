package io.opencelium.core.config.mongo;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.regex.Pattern;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;

import io.opencelium.core.config.BootstrapProperties;

/**
 * Where one tenant's data lives: a connection string and the database on that server.
 *
 * @param connectionString server address, credentials and options
 * @param databaseName     database to use; may differ from the path in the connection string
 * @param source           the property the connection was configured with ({@code spring.mongodb.uri} or
 *                         {@code spring.mongodb.host}), named in error messages
 */
public record MongoConnection(ConnectionString connectionString, String databaseName, String source) {

	/** Scheme-like prefix (also {@code jdbc:} or a typo), then everything up to the last {@code @}. */
	private static final Pattern UP_TO_LAST_AT = Pattern.compile("^(\\s*[A-Za-z][A-Za-z0-9+.-]*:/*)?.*@",
			Pattern.DOTALL);

	/** Values of options that carry secrets: proxyPassword, authMechanismProperties (AWS session token), ... */
	private static final Pattern SECRET_OPTION = Pattern.compile(
			"(?i)([?&;](?:authMechanismProperties|[^=&;?]*(?:password|secret|token)[^=&;?]*)=)[^&;]*");

	public MongoConnection {
		Objects.requireNonNull(connectionString, "connectionString");
		Objects.requireNonNull(databaseName, "databaseName");
		Objects.requireNonNull(source, "source");
	}

	/** A connection configured through {@code spring.mongodb.uri}. */
	public MongoConnection(ConnectionString connectionString, String databaseName) {
		this(connectionString, databaseName, BootstrapProperties.MONGODB_URI);
	}

	/**
	 * The connection string without secrets, rebuilt from the parsed parts: the password becomes {@code ****} and so do
	 * secret option values. Safe for logs and error messages.
	 */
	public String redacted() {
		String raw = connectionString.getConnectionString();
		if (connectionString.getUsername() == null && beforeOptions(raw).contains("@")) {
			// The driver misread an unencoded password (e.g. "oc:1234/abc@db" as host oc, port 1234).
			return maskUnparsed(raw);
		}
		var shown = new StringBuilder(connectionString.isSrvProtocol() ? "mongodb+srv://" : "mongodb://");
		if (connectionString.getUsername() != null) {
			shown.append(URLEncoder.encode(connectionString.getUsername(), StandardCharsets.UTF_8).replace("+", "%20"))
					.append(connectionString.getPassword() != null ? ":****@" : "@");
		}
		shown.append(String.join(",", connectionString.getHosts()));
		String options = raw.contains("?") ? SECRET_OPTION.matcher(raw.substring(raw.indexOf('?'))).replaceAll("$1****")
				: "";
		if (connectionString.getDatabase() != null) {
			shown.append('/').append(connectionString.getDatabase());
		}
		else if (!options.isEmpty()) {
			shown.append('/');
		}
		return shown.append(options).toString();
	}

	/**
	 * Masks input the driver could not parse: everything up to the last {@code @} and secret option values. Over-masks
	 * on purpose; a garbled address in an error is acceptable, a leaked password is not.
	 */
	static String maskUnparsed(String uri) {
		// Options first: an '@' inside a secret option value must not become the "last @" of the second step.
		String optionsMasked = SECRET_OPTION.matcher(uri).replaceAll("$1****");
		return UP_TO_LAST_AT.matcher(optionsMasked).replaceFirst("$1****@");
	}

	/** Whether the input may contain a secret, so that parser messages quoting parts of it must not be shown. */
	static boolean mayContainSecret(String uri) {
		return uri.contains("@") || SECRET_OPTION.matcher(uri).find();
	}

	private static String beforeOptions(String raw) {
		return raw.contains("?") ? raw.substring(0, raw.indexOf('?')) : raw;
	}

	/**
	 * Connections with equal keys can share one {@code MongoClient}. The key is the driver's own parsed settings, so
	 * {@code db.example} equals {@code db.example:27017} and option order does not matter; the database path is not
	 * part of it, except where it is the credential's source.
	 */
	MongoClientSettings clusterKey() {
		return MongoClientSettings.builder().applyConnectionString(connectionString).build();
	}

	/** Redacted: {@link ConnectionString#toString()} would print the password. */
	@Override
	public String toString() {
		return "MongoConnection[" + redacted() + ", database=" + databaseName + ", source=" + source + "]";
	}

}

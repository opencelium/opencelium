package io.opencelium.core.config;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.mongodb.autoconfigure.MongoProperties;

/**
 * Raw reads of bootstrap properties, and the names of the {@code spring.mongodb.*} properties shared by the defaults
 * post-processor and the MongoDB connection resolver, so both agree on what "configured" means.
 */
public final class BootstrapProperties {

	public static final String MONGODB_URI = "spring.mongodb.uri";

	public static final String MONGODB_HOST = "spring.mongodb.host";

	public static final String MONGODB_USERNAME = "spring.mongodb.username";

	public static final String MONGODB_PASSWORD = "spring.mongodb.password";

	public static final String MONGODB_AUTHENTICATION_DATABASE = "spring.mongodb.authentication-database";

	public static final String MONGODB_DATABASE = "spring.mongodb.database";

	private BootstrapProperties() {
	}

	/** Reads through the {@link Binder}, so relaxed names ({@code OPENCELIUM_DEPLOYMENTMODE}) count as set. */
	static Optional<String> read(Binder binder, String name) {
		return binder.bind(name, String.class).map(Optional::of).orElseGet(Optional::empty);
	}

	/**
	 * The set {@code spring.mongodb.*} properties that describe the server without a URI, in a fixed order. Boot
	 * builds a connection string from them only when no URI is set, and silently ignores all of them otherwise.
	 */
	public static List<String> mongoAddressPropertiesSet(MongoProperties mongo) {
		List<String> set = new ArrayList<>();
		addIf(set, mongo.getHost() != null, MONGODB_HOST);
		addIf(set, mongo.getPort() != null, "spring.mongodb.port");
		addIf(set, !"mongodb".equals(mongo.getProtocol()), "spring.mongodb.protocol");
		addIf(set, mongo.getUsername() != null, MONGODB_USERNAME);
		addIf(set, mongo.getPassword() != null, MONGODB_PASSWORD);
		addIf(set, mongo.getAuthenticationDatabase() != null, MONGODB_AUTHENTICATION_DATABASE);
		addIf(set, mongo.getReplicaSetName() != null, "spring.mongodb.replica-set-name");
		addIf(set, mongo.getAdditionalHosts() != null && !mongo.getAdditionalHosts().isEmpty(),
				"spring.mongodb.additional-hosts");
		return set;
	}

	private static void addIf(List<String> names, boolean condition, String name) {
		if (condition) {
			names.add(name);
		}
	}

}

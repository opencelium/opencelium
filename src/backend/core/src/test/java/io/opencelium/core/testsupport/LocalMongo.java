package io.opencelium.core.testsupport;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClients;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.test.context.DynamicPropertyRegistry;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.OpenCeliumProperties;

/**
 * Integration tests run against a real MongoDB: {@code OC_TEST_MONGO_URI}, default {@code mongodb://localhost:27017}.
 * It may carry credentials and options (for example {@code mongodb://oc:pw@db.example/?authSource=admin}); a
 * database path in it is ignored. Each test class gets its own database, dropped after the class by {@link Cleanup}.
 * <p>
 * Always use a full {@code @SpringBootTest} with this helper, never a test slice such as {@code @DataMongoTest}:
 * slices do not honour the auto-configuration exclusions on {@code CoreApplication}, so they would get Boot's own
 * Mongo client (with its {@code localhost/test} fallback) instead of {@code MongoConfig} and the startup ping.
 * <p>
 * Usage in a {@link MongoIntegrationTest} class; the data directory keeps the generated master key out of the
 * working tree:
 * <pre>{@code
 * @TempDir
 * static Path dataDir;
 *
 * @DynamicPropertySource
 * static void properties(DynamicPropertyRegistry registry) {
 *     LocalMongo.register(registry, MyTest.class, () -> dataDir);
 * }
 * }</pre>
 * A test that starts the application through {@link CoreStartup} instead passes {@link #uriFor(Class)} and
 * declares {@code @ExtendWith(LocalMongo.Cleanup.class)}.
 */
public final class LocalMongo {

	public static final String SERVER_VARIABLE = "OC_TEST_MONGO_URI";

	public static final String DEFAULT_SERVER = "mongodb://localhost:27017";

	private static final Map<Class<?>, String> DATABASES = new ConcurrentHashMap<>();

	private LocalMongo() {
	}

	/** The test server with {@code database} as path, keeping its credentials and options. */
	public static String uri(String database) {
		ConnectionString server = server();
		String login = "";
		if (server.getUsername() != null) {
			String password = server.getPassword() != null ? ":" + encode(new String(server.getPassword())) : "";
			login = encode(server.getUsername()) + password + "@";
		}
		return build(server, login, database);
	}

	/**
	 * Whether the tests run against the documented default server {@code mongodb://localhost:27017}, that is, whether
	 * {@code OC_TEST_MONGO_URI} is not set. Tests of the zero-configuration start need that server.
	 */
	public static boolean isDefaultServer() {
		return System.getenv(SERVER_VARIABLE) == null;
	}

	/** The test server with the database of {@code testClass} as path. */
	public static String uriFor(Class<?> testClass) {
		return uri(databaseFor(testClass));
	}

	/** The test server with {@code database} as path, but logging in as {@code user}/{@code password} instead. */
	public static String uriWithLogin(String user, String password, String database) {
		return build(server(), encode(user) + ":" + encode(password) + "@", database);
	}

	/** {@code oc_test_<class>_<6 random chars>}, stable for the class within one test run. */
	public static String databaseFor(Class<?> testClass) {
		return DATABASES.computeIfAbsent(testClass, type -> "oc_test_" + type.getSimpleName().toLowerCase(Locale.ROOT)
				+ "_" + UUID.randomUUID().toString().substring(0, 6));
	}

	/**
	 * Registers the data directory and the per-class database. Both are read when the context starts, after JUnit
	 * has created a static {@code @TempDir}.
	 */
	public static void register(DynamicPropertyRegistry registry, Class<?> testClass, Supplier<Path> dataDir) {
		registry.add(OpenCeliumProperties.DATA_DIR, () -> dataDir.get().toString());
		registry.add(BootstrapProperties.MONGODB_URI, () -> uriFor(testClass));
	}

	/** Drops the database of {@code testClass}; gives up after 5 s when the server is gone, not the driver's 30 s. */
	public static void drop(Class<?> testClass) {
		String database = DATABASES.remove(testClass);
		if (database == null) {
			return;
		}
		var settings = MongoClientSettings.builder().applyConnectionString(new ConnectionString(uri(database)))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS)).build();
		try (var client = MongoClients.create(settings)) {
			client.getDatabase(database).drop();
		}
	}

	/** Drops the database of the test class after its last test. {@link MongoIntegrationTest} registers it. */
	public static final class Cleanup implements AfterAllCallback {

		@Override
		public void afterAll(ExtensionContext context) {
			drop(context.getRequiredTestClass());
		}

	}

	private static ConnectionString server() {
		return new ConnectionString(System.getenv().getOrDefault(SERVER_VARIABLE, DEFAULT_SERVER));
	}

	private static String build(ConnectionString server, String login, String database) {
		String raw = server.getConnectionString();
		String options = raw.contains("?") ? raw.substring(raw.indexOf('?') + 1) : "";
		// Without authSource the path database becomes the login's source; test users live in admin.
		if (!login.isEmpty() && !options.toLowerCase(Locale.ROOT).contains("authsource=")) {
			options = options.isEmpty() ? "authSource=admin" : options + "&authSource=admin";
		}
		return (server.isSrvProtocol() ? "mongodb+srv://" : "mongodb://") + login + String.join(",", server.getHosts())
				+ "/" + database + (options.isEmpty() ? "" : "?" + options);
	}

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
	}

}

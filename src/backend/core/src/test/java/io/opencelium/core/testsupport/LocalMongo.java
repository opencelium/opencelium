package io.opencelium.core.testsupport;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClients;
import org.springframework.test.context.DynamicPropertyRegistry;

/**
 * Integration tests run against a real MongoDB: {@code OC_TEST_MONGO_URI}, default {@code mongodb://localhost:27017}.
 * It may carry credentials and options (for example {@code mongodb://oc:pw@db.example/?authSource=admin}); a
 * database path in it is ignored. Each test class gets its own database, dropped after the class.
 * <p>
 * Always use a full {@code @SpringBootTest} with this helper, never a test slice such as {@code @DataMongoTest}:
 * slices do not honour the auto-configuration exclusions on {@code CoreApplication}, so they would get Boot's own
 * Mongo client (with its {@code localhost/test} fallback) instead of {@code MongoConfig} and the startup ping.
 * <p>
 * Usage in a {@code @SpringBootTest} class:
 * <pre>{@code
 * @DynamicPropertySource
 * static void mongo(DynamicPropertyRegistry registry) { LocalMongo.register(registry, MyTest.class); }
 *
 * @AfterAll
 * static void dropDatabase() { LocalMongo.drop(MyTest.class); }
 * }</pre>
 */
public final class LocalMongo {

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

	/** The test server with {@code database} as path, but logging in as {@code user}/{@code password} instead. */
	public static String uriWithLogin(String user, String password, String database) {
		return build(server(), encode(user) + ":" + encode(password) + "@", database);
	}

	/** {@code oc_test_<class>_<6 random chars>}, stable for the class within one test run. */
	public static String databaseFor(Class<?> testClass) {
		return DATABASES.computeIfAbsent(testClass, type -> "oc_test_" + type.getSimpleName().toLowerCase(Locale.ROOT)
				+ "_" + UUID.randomUUID().toString().substring(0, 6));
	}

	public static void register(DynamicPropertyRegistry registry, Class<?> testClass) {
		registry.add("spring.mongodb.uri", () -> uri(databaseFor(testClass)));
	}

	public static void drop(Class<?> testClass) {
		String database = DATABASES.remove(testClass);
		if (database == null) {
			return;
		}
		try (var client = MongoClients.create(uri(database))) {
			client.getDatabase(database).drop();
		}
	}

	private static ConnectionString server() {
		return new ConnectionString(System.getenv().getOrDefault("OC_TEST_MONGO_URI", "mongodb://localhost:27017"));
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

package io.opencelium.core.config.mongo;

import java.nio.file.Path;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

import static io.opencelium.core.config.DeploymentMode.CLOUD;
import static io.opencelium.core.config.DeploymentMode.SELF_HOST;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_AUTHENTICATION_DATABASE;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_DATABASE;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_HOST;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_PASSWORD;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_URI;
import static io.opencelium.core.config.BootstrapProperties.MONGODB_USERNAME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class StaticMongoConnectionResolverTest {

	private static final TenantId TENANT = TenantId.SELF_HOST;

	private final MockEnvironment environment = new MockEnvironment();

	@Test
	void selfModeResolvesSelfAndSystemToTheConfiguredDatabase() {
		environment.setProperty(MONGODB_URI, "mongodb://db.example:27017/oc_prod");

		var resolver = resolver(SELF_HOST);

		assertThat(resolver.resolve(TENANT).redacted()).isEqualTo("mongodb://db.example:27017/oc_prod");
		assertThat(resolver.resolve(TENANT).databaseName()).isEqualTo("oc_prod");
		assertThat(resolver.resolve(TenantId.SYSTEM)).isEqualTo(resolver.resolve(TENANT));
	}

	@Test
	void databaseDefaultsToOpenceliumWhenTheUriHasNoPath() {
		environment.setProperty(MONGODB_URI, "mongodb://db.example:27017");

		assertThat(resolver(SELF_HOST).resolve(TENANT).databaseName()).isEqualTo("opencelium");
	}

	@Test
	void databasePropertyOverridesTheUriPath() {
		environment.setProperty(MONGODB_URI, "mongodb://db.example:27017/from_uri");
		environment.setProperty(MONGODB_DATABASE, "from_property");

		assertThat(resolver(SELF_HOST).resolve(TENANT).databaseName()).isEqualTo("from_property");
	}

	@Test
	void bootHostAndPortPropertiesAreSupported() {
		environment.setProperty(MONGODB_HOST, "db.example");
		environment.setProperty("spring.mongodb.port", "27018");

		MongoConnection connection = resolver(SELF_HOST).resolve(TENANT);

		assertThat(connection.connectionString().getHosts()).containsExactly("db.example:27018");
		assertThat(connection.databaseName()).isEqualTo("opencelium");
		assertThat(connection.connectionString().getDatabase()).isEqualTo("opencelium");
	}

	@Test
	void uriTogetherWithHostIsRejected() {
		environment.setProperty(MONGODB_URI, "mongodb://db.example:27017/opencelium");
		environment.setProperty(MONGODB_HOST, "other.example");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("not both")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.host"));
	}

	@Test
	void uriTogetherWithCredentialPropertiesIsRejectedBecauseBootWouldIgnoreThem() {
		environment.setProperty(MONGODB_URI, "mongodb://db.example:27017/opencelium");
		environment.setProperty(MONGODB_USERNAME, "oc");
		environment.setProperty(MONGODB_PASSWORD, "s3cret");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("spring.mongodb.username, spring.mongodb.password, not both")
				.withMessageContaining("Boot ignores them")
				.withMessageNotContaining("s3cret")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.username"));
	}

	@Test
	void credentialsWithoutHostMeanLocalhostInSelfMode() {
		environment.setProperty(MONGODB_USERNAME, "oc");
		environment.setProperty(MONGODB_PASSWORD, "s3cret");
		environment.setProperty(MONGODB_AUTHENTICATION_DATABASE, "admin");

		MongoConnection connection = resolver(SELF_HOST).resolve(TENANT);

		// Boot writes the host without port; the driver then uses 27017.
		assertThat(connection.connectionString().getHosts()).containsExactly("localhost");
		assertThat(connection.connectionString().getCredential().getUserName()).isEqualTo("oc");
		assertThat(connection.connectionString().getCredential().getSource()).isEqualTo("admin");
		assertThat(connection.databaseName()).isEqualTo("opencelium");
	}

	@Test
	void cloudModeNeedsAnExplicitServerEvenWithCredentials() {
		environment.setProperty(MONGODB_USERNAME, "oc");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(CLOUD))
				.withMessageContaining("cloud mode requires the system database URI explicitly");
	}

	@Test
	void cloudModeWithoutUriStopsNamingTheProperty() {
		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(CLOUD))
				.withMessageContaining("cloud mode requires the system database URI explicitly")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.uri"));
	}

	@Test
	void cloudModeResolvesTheSystemDatabase() {
		environment.setProperty(MONGODB_URI, "mongodb://sys.example:27017/oc_system");

		assertThat(resolver(CLOUD).resolve(TenantId.SYSTEM).databaseName()).isEqualTo("oc_system");
	}

	@Test
	void invalidUriStopsWithoutShowingThePassword() {
		environment.setProperty(MONGODB_URI, "mongodb://oc:s3cret@db.example:notaport/opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("not a valid MongoDB connection string")
				.withMessageNotContaining("s3cret")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.uri"));
	}

	@Test
	void invalidUriWithUnencodedAtSignNeverShowsThePassword() {
		environment.setProperty(MONGODB_URI, "mongodb://oc:p@ss@db.example/opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("'mongodb://****@db.example/opencelium' is not a valid MongoDB connection string")
				.withMessageContaining("URL-encode")
				.withMessageNotContaining("p@ss").withMessageNotContaining("ss@")
				.satisfies(failure -> assertThat(failure).hasNoCause());
	}

	@Test
	void uriWithoutSchemeNeverShowsThePassword() {
		environment.setProperty(MONGODB_URI, "oc:s3cret@db.example:27017/opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageNotContaining("s3cret");
	}

	@Test
	void invalidUriWithoutSecretsShowsTheParserMessage() {
		environment.setProperty(MONGODB_URI, "localhost:27017");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("must start with");
	}

	@Test
	void passwordTheDriverWouldMisreadAsHostAndPortIsRejected() {
		environment.setProperty(MONGODB_URI, "mongodb://oc:1234/abc@db.example/opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("probably not URL-encoded")
				.withMessageNotContaining("1234").withMessageNotContaining("abc");
	}

	@Test
	void proxyPasswordIsRejectedBecauseTheDriverLogsIt() {
		environment.setProperty(MONGODB_URI,
				"mongodb://db.example/opencelium?proxyHost=proxy.example&proxyUsername=u&proxyPassword=pp456");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("proxyPassword").withMessageNotContaining("pp456")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.uri"));
	}

	@Test
	void conflictTellsTheOperatorWhatToRemove() {
		environment.setProperty(MONGODB_URI, "mongodb://db.example:27017/opencelium");
		environment.setProperty(MONGODB_HOST, "other.example");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.satisfies(failure -> assertThat(failure.action()).hasValueSatisfying(action -> assertThat(action)
						.startsWith("Remove spring.mongodb.host, or remove spring.mongodb.uri")));
	}

	@Test
	void sourceNamesTheStyleOfConfiguration() {
		environment.setProperty(MONGODB_HOST, "db.example");
		assertThat(resolver(SELF_HOST).resolve(TENANT).source()).isEqualTo("spring.mongodb.host");

		var uriEnvironment = new MockEnvironment().withProperty(MONGODB_URI, "mongodb://db.example/x");
		var properties = new OpenCeliumProperties(SELF_HOST, Path.of("/unused"), Optional.empty());
		assertThat(StaticMongoConnectionResolver.from(properties, uriEnvironment).resolve(TENANT).source())
				.isEqualTo("spring.mongodb.uri");
	}

	@Test
	void emptyDatabasePropertyStopsNamingIt() {
		environment.setProperty(MONGODB_URI, "mongodb://db.example:27017/opencelium");
		environment.setProperty(MONGODB_DATABASE, "");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("not a valid MongoDB database name")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.database"));
	}

	@Test
	void invalidDatabaseNameInHostModeStopsNamingIt() {
		environment.setProperty(MONGODB_HOST, "db.example");
		environment.setProperty(MONGODB_DATABASE, "bad.name");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.database"));
	}

	@Test
	void passwordWithoutUsernameIsRejectedBecauseBootWouldIgnoreIt() {
		environment.setProperty(MONGODB_HOST, "db.example");
		environment.setProperty(MONGODB_PASSWORD, "s3cret");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("spring.mongodb.password is set but spring.mongodb.username is not")
				.withMessageNotContaining("s3cret")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.username"));
	}

	@Test
	void authenticationDatabaseWithoutUsernameIsRejected() {
		environment.setProperty(MONGODB_HOST, "db.example");
		environment.setProperty(MONGODB_AUTHENTICATION_DATABASE, "admin");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.username"));
	}

	@Test
	void spaceInHostStylePasswordIsRejectedBecauseBootWouldCorruptIt() {
		environment.setProperty(MONGODB_HOST, "db.example");
		environment.setProperty(MONGODB_USERNAME, "oc");
		environment.setProperty(MONGODB_PASSWORD, "pa ss");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(SELF_HOST))
				.withMessageContaining("contains a space").withMessageNotContaining("pa ss")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.password"));
	}

	@Test
	void sslAndUuidPropertiesAreRejectedInsteadOfIgnored() {
		assertRejected("spring.mongodb.ssl.enabled", "true", "tls=true");
		assertRejected("spring.mongodb.ssl.bundle", "corporate", "tls=true");
		assertRejected("spring.mongodb.representation.uuid", "java-legacy", "uuidRepresentation=");
	}

	private void assertRejected(String property, String value, String uriOption) {
		var env = new MockEnvironment().withProperty(MONGODB_URI, "mongodb://db.example/x")
				.withProperty(property, value);
		var properties = new OpenCeliumProperties(SELF_HOST, Path.of("/unused"), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class)
				.isThrownBy(() -> StaticMongoConnectionResolver.from(properties, env)).as(property)
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo(property))
				.satisfies(failure -> assertThat(failure.action()).hasValueSatisfying(
						action -> assertThat(action).contains(uriOption)));
	}

	@Test
	void otherTenantsAreNotRoutedYet() {
		environment.setProperty(MONGODB_URI, "mongodb://sys.example:27017/oc_system");

		assertThatExceptionOfType(UnsupportedOperationException.class)
				.isThrownBy(() -> resolver(CLOUD).resolve(TenantId.of("acme")))
				.withMessageContaining("acme");
	}

	private StaticMongoConnectionResolver resolver(DeploymentMode mode) {
		var properties = new OpenCeliumProperties(mode, Path.of("/unused"), Optional.empty());
		return StaticMongoConnectionResolver.from(properties, environment);
	}

}

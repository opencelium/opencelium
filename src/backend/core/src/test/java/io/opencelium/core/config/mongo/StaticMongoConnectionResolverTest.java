package io.opencelium.core.config.mongo;

import java.nio.file.Path;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class StaticMongoConnectionResolverTest {

	private final MockEnvironment environment = new MockEnvironment();

	@Test
	void selfModeResolvesSelfAndSystemToTheConfiguredDatabase() {
		environment.setProperty("spring.mongodb.uri", "mongodb://db.example:27017/oc_prod");

		var resolver = resolver(DeploymentMode.SELF);

		assertThat(resolver.resolve(TenantId.SELF).redacted()).isEqualTo("mongodb://db.example:27017/oc_prod");
		assertThat(resolver.resolve(TenantId.SELF).databaseName()).isEqualTo("oc_prod");
		assertThat(resolver.resolve(TenantId.SYSTEM)).isEqualTo(resolver.resolve(TenantId.SELF));
	}

	@Test
	void databaseDefaultsToOpenceliumWhenTheUriHasNoPath() {
		environment.setProperty("spring.mongodb.uri", "mongodb://db.example:27017");

		assertThat(resolver(DeploymentMode.SELF).resolve(TenantId.SELF).databaseName()).isEqualTo("opencelium");
	}

	@Test
	void databasePropertyOverridesTheUriPath() {
		environment.setProperty("spring.mongodb.uri", "mongodb://db.example:27017/from_uri");
		environment.setProperty("spring.mongodb.database", "from_property");

		assertThat(resolver(DeploymentMode.SELF).resolve(TenantId.SELF).databaseName()).isEqualTo("from_property");
	}

	@Test
	void bootHostAndPortPropertiesAreSupported() {
		environment.setProperty("spring.mongodb.host", "db.example");
		environment.setProperty("spring.mongodb.port", "27018");

		MongoConnection connection = resolver(DeploymentMode.SELF).resolve(TenantId.SELF);

		assertThat(connection.connectionString().getHosts()).containsExactly("db.example:27018");
		assertThat(connection.databaseName()).isEqualTo("opencelium");
		assertThat(connection.connectionString().getDatabase()).isEqualTo("opencelium");
	}

	@Test
	void uriTogetherWithHostIsRejected() {
		environment.setProperty("spring.mongodb.uri", "mongodb://db.example:27017/opencelium");
		environment.setProperty("spring.mongodb.host", "other.example");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("not both")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.host"));
	}

	@Test
	void uriTogetherWithCredentialPropertiesIsRejectedBecauseBootWouldIgnoreThem() {
		environment.setProperty("spring.mongodb.uri", "mongodb://db.example:27017/opencelium");
		environment.setProperty("spring.mongodb.username", "oc");
		environment.setProperty("spring.mongodb.password", "s3cret");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("spring.mongodb.username, spring.mongodb.password, not both")
				.withMessageContaining("Boot ignores them")
				.withMessageNotContaining("s3cret")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.username"));
	}

	@Test
	void credentialsWithoutHostMeanLocalhostInSelfMode() {
		environment.setProperty("spring.mongodb.username", "oc");
		environment.setProperty("spring.mongodb.password", "s3cret");
		environment.setProperty("spring.mongodb.authentication-database", "admin");

		MongoConnection connection = resolver(DeploymentMode.SELF).resolve(TenantId.SELF);

		// Boot writes the host without port; the driver then uses 27017.
		assertThat(connection.connectionString().getHosts()).containsExactly("localhost");
		assertThat(connection.connectionString().getCredential().getUserName()).isEqualTo("oc");
		assertThat(connection.connectionString().getCredential().getSource()).isEqualTo("admin");
		assertThat(connection.databaseName()).isEqualTo("opencelium");
	}

	@Test
	void saasModeNeedsAnExplicitServerEvenWithCredentials() {
		environment.setProperty("spring.mongodb.username", "oc");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SAAS))
				.withMessageContaining("saas mode requires the system database URI explicitly");
	}

	@Test
	void saasModeWithoutUriStopsNamingTheProperty() {
		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SAAS))
				.withMessageContaining("saas mode requires the system database URI explicitly")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.uri"));
	}

	@Test
	void saasModeResolvesTheSystemDatabase() {
		environment.setProperty("spring.mongodb.uri", "mongodb://sys.example:27017/oc_system");

		assertThat(resolver(DeploymentMode.SAAS).resolve(TenantId.SYSTEM).databaseName()).isEqualTo("oc_system");
	}

	@Test
	void invalidUriStopsWithoutShowingThePassword() {
		environment.setProperty("spring.mongodb.uri", "mongodb://oc:s3cret@db.example:notaport/opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("not a valid MongoDB connection string")
				.withMessageNotContaining("s3cret")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.uri"));
	}

	@Test
	void invalidUriWithUnencodedAtSignNeverShowsThePassword() {
		environment.setProperty("spring.mongodb.uri", "mongodb://oc:p@ss@db.example/opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("'mongodb://****@db.example/opencelium' is not a valid MongoDB connection string")
				.withMessageContaining("URL-encode")
				.withMessageNotContaining("p@ss").withMessageNotContaining("ss@")
				.satisfies(failure -> assertThat(failure).hasNoCause());
	}

	@Test
	void uriWithoutSchemeNeverShowsThePassword() {
		environment.setProperty("spring.mongodb.uri", "oc:s3cret@db.example:27017/opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageNotContaining("s3cret");
	}

	@Test
	void invalidUriWithoutSecretsShowsTheParserMessage() {
		environment.setProperty("spring.mongodb.uri", "localhost:27017");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("must start with");
	}

	@Test
	void passwordTheDriverWouldMisreadAsHostAndPortIsRejected() {
		environment.setProperty("spring.mongodb.uri", "mongodb://oc:1234/abc@db.example/opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("probably not URL-encoded")
				.withMessageNotContaining("1234").withMessageNotContaining("abc");
	}

	@Test
	void proxyPasswordIsRejectedBecauseTheDriverLogsIt() {
		environment.setProperty("spring.mongodb.uri",
				"mongodb://db.example/opencelium?proxyHost=proxy.example&proxyUsername=u&proxyPassword=pp456");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("proxyPassword").withMessageNotContaining("pp456")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.uri"));
	}

	@Test
	void conflictTellsTheOperatorWhatToRemove() {
		environment.setProperty("spring.mongodb.uri", "mongodb://db.example:27017/opencelium");
		environment.setProperty("spring.mongodb.host", "other.example");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.satisfies(failure -> assertThat(failure.action()).hasValueSatisfying(action -> assertThat(action)
						.startsWith("Remove spring.mongodb.host, or remove spring.mongodb.uri")));
	}

	@Test
	void sourceNamesTheStyleOfConfiguration() {
		environment.setProperty("spring.mongodb.host", "db.example");
		assertThat(resolver(DeploymentMode.SELF).resolve(TenantId.SELF).source()).isEqualTo("spring.mongodb.host");

		var uriEnvironment = new MockEnvironment().withProperty("spring.mongodb.uri", "mongodb://db.example/x");
		var properties = new OpenCeliumProperties(DeploymentMode.SELF, Path.of("/unused"), Optional.empty());
		assertThat(StaticMongoConnectionResolver.from(properties, uriEnvironment).resolve(TenantId.SELF).source())
				.isEqualTo("spring.mongodb.uri");
	}

	@Test
	void emptyDatabasePropertyStopsNamingIt() {
		environment.setProperty("spring.mongodb.uri", "mongodb://db.example:27017/opencelium");
		environment.setProperty("spring.mongodb.database", "");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("not a valid MongoDB database name")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.database"));
	}

	@Test
	void invalidDatabaseNameInHostModeStopsNamingIt() {
		environment.setProperty("spring.mongodb.host", "db.example");
		environment.setProperty("spring.mongodb.database", "bad.name");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.database"));
	}

	@Test
	void passwordWithoutUsernameIsRejectedBecauseBootWouldIgnoreIt() {
		environment.setProperty("spring.mongodb.host", "db.example");
		environment.setProperty("spring.mongodb.password", "s3cret");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.withMessageContaining("spring.mongodb.password is set but spring.mongodb.username is not")
				.withMessageNotContaining("s3cret")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.username"));
	}

	@Test
	void authenticationDatabaseWithoutUsernameIsRejected() {
		environment.setProperty("spring.mongodb.host", "db.example");
		environment.setProperty("spring.mongodb.authentication-database", "admin");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.username"));
	}

	@Test
	void spaceInHostStylePasswordIsRejectedBecauseBootWouldCorruptIt() {
		environment.setProperty("spring.mongodb.host", "db.example");
		environment.setProperty("spring.mongodb.username", "oc");
		environment.setProperty("spring.mongodb.password", "pa ss");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> resolver(DeploymentMode.SELF))
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
		var env = new MockEnvironment().withProperty("spring.mongodb.uri", "mongodb://db.example/x")
				.withProperty(property, value);
		var properties = new OpenCeliumProperties(DeploymentMode.SELF, Path.of("/unused"), Optional.empty());

		assertThatExceptionOfType(BootstrapPropertyException.class)
				.isThrownBy(() -> StaticMongoConnectionResolver.from(properties, env)).as(property)
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo(property))
				.satisfies(failure -> assertThat(failure.action()).hasValueSatisfying(
						action -> assertThat(action).contains(uriOption)));
	}

	@Test
	void otherTenantsAreNotRoutedYet() {
		environment.setProperty("spring.mongodb.uri", "mongodb://sys.example:27017/oc_system");

		assertThatExceptionOfType(UnsupportedOperationException.class)
				.isThrownBy(() -> resolver(DeploymentMode.SAAS).resolve(TenantId.of("acme")))
				.withMessageContaining("acme");
	}

	private StaticMongoConnectionResolver resolver(DeploymentMode mode) {
		var properties = new OpenCeliumProperties(mode, Path.of("/unused"), Optional.empty());
		return StaticMongoConnectionResolver.from(properties, environment);
	}

}

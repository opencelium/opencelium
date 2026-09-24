package io.opencelium.core.config.mongo;

import com.mongodb.client.MongoClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.OpenCeliumProperties;

/**
 * Replaces Boot's Mongo auto-configuration (excluded on {@code CoreApplication}). The {@link MongoClient} bean is
 * created only after {@link MongoStartupPing} succeeded, so everything that uses MongoDB starts from a server that
 * answers and accepts the configured login. The beans point at the system database; in self mode that is also the
 * tenant's database.
 */
@Configuration(proxyBeanMethods = false)
public final class MongoConfig {

	@Bean
	MongoConnectionResolver mongoConnectionResolver(OpenCeliumProperties properties, Environment environment) {
		return StaticMongoConnectionResolver.from(properties, environment);
	}

	@Bean
	MongoClientFactory mongoClientFactory() {
		return new MongoClientFactory();
	}

	@Bean
	MongoStartupPing mongoStartupPing() {
		return new MongoStartupPing();
	}

	// The factory owns and closes the client, so Spring must not close it a second time.
	@Bean(destroyMethod = "")
	MongoClient mongoClient(MongoConnectionResolver resolver, MongoClientFactory factory, MongoStartupPing ping) {
		MongoConnection system = resolver.resolve(TenantId.SYSTEM);
		ping.verify(system);
		return factory.clientFor(system);
	}

	@Bean
	MongoDatabaseFactory mongoDatabaseFactory(MongoClient client, MongoConnectionResolver resolver) {
		return new SimpleMongoClientDatabaseFactory(client, resolver.resolve(TenantId.SYSTEM).databaseName());
	}

	@Bean
	MongoTemplate mongoTemplate(MongoDatabaseFactory databaseFactory) {
		return new MongoTemplate(databaseFactory);
	}

}

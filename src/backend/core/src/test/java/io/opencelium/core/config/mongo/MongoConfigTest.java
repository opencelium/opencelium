package io.opencelium.core.config.mongo;

import java.nio.file.Path;

import com.mongodb.client.MongoClient;
import org.bson.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.mongodb.autoconfigure.MongoConnectionDetails;
import org.springframework.boot.mongodb.autoconfigure.MongoProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class MongoConfigTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		registry.add("opencelium.data-dir", () -> dataDir.toString());
		LocalMongo.register(registry, MongoConfigTest.class);
	}

	@AfterAll
	static void dropDatabase() {
		LocalMongo.drop(MongoConfigTest.class);
	}

	@Autowired
	ApplicationContext context;

	@Autowired
	MongoTemplate mongoTemplate;

	@Test
	void bootsOwnMongoAutoConfigurationIsNotActive() {
		assertThat(context.getBeansOfType(MongoProperties.class)).isEmpty();
		assertThat(context.getBeansOfType(MongoConnectionDetails.class)).isEmpty();
		assertThat(context.getBeansOfType(MongoClient.class)).hasSize(1);
	}

	@Test
	void templateWritesAndReadsInTheConfiguredDatabase() {
		mongoTemplate.insert(new Document("probe", 42), "probes");

		assertThat(mongoTemplate.getDb().getName()).isEqualTo(LocalMongo.databaseFor(MongoConfigTest.class));
		assertThat(mongoTemplate.findAll(Document.class, "probes")).singleElement()
				.satisfies(document -> assertThat(document.get("probe")).isEqualTo(42));
	}

}

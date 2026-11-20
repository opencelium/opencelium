package io.opencelium.core.auth;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexField;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;

/** MongoDB removes a session record by itself after the end of the session. */
@MongoIntegrationTest
class SessionIndexesTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, SessionIndexesTest.class, () -> dataDir);
	}

	@Autowired
	MongoTemplate mongo;

	@Test
	void indexesHaveATtlIndexOnTheEndOfTheSession() {
		IndexInfo index = mongo.indexOps(SessionRecord.class).getIndexInfo().stream()
				.filter(info -> info.getIndexFields().stream().map(IndexField::getKey).toList()
						.equals(List.of(SessionRecord.ENDS_AT)))
				.findFirst().orElse(null);

		assertThat(index).as("the index on the end of the session").isNotNull();
		assertThat(index.getExpireAfter()).contains(Duration.ZERO);
	}

}

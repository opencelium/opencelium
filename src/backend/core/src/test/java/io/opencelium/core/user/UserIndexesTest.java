package io.opencelium.core.user;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexField;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

@SpringBootTest
class UserIndexesTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		registry.add("opencelium.data-dir", () -> dataDir.toString());
		LocalMongo.register(registry, UserIndexesTest.class);
	}

	@AfterAll
	static void dropDatabase() {
		LocalMongo.drop(UserIndexesTest.class);
	}

	@Autowired
	UserRepository users;

	@Autowired
	MongoTemplate mongo;

	@BeforeEach
	void removeUsers() {
		mongo.remove(new Query(), UserDocument.class);
	}

	@Test
	void startupCreatesAUniqueIndexOnTenantAndUsername() {
		IndexInfo index = mongo.indexOps(UserDocument.class).getIndexInfo().stream()
				.filter(info -> info.getName().equals(UserIndexes.TENANT_USERNAME)).findFirst().orElseThrow();

		assertThat(index.isUnique()).isTrue();
		assertThat(index.getIndexFields()).extracting(IndexField::getKey).containsExactly("tenantId", "username");
	}

	@Test
	void insertFailsForASecondUserWithTheSameUsernameInOneTenant() {
		users.insert(user("self", "admin"));

		assertThatExceptionOfType(DuplicateKeyException.class).isThrownBy(() -> users.insert(user("self", "admin")));
	}

	@Test
	void insertAllowsTheSameUsernameInAnotherTenant() {
		users.insert(user("self", "admin"));

		users.insert(user("other", "admin"));

		assertThat(users.findByTenantIdAndUsername("other", "admin")).isPresent();
	}

	private static UserDocument user(String tenant, String username) {
		Instant now = Instant.now();
		return new UserDocument(null, tenant, username, "{bcrypt}x", Set.of(), false, now, false, false, now);
	}

}

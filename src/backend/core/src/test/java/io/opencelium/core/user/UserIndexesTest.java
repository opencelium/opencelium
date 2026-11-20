package io.opencelium.core.user;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexField;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

@MongoIntegrationTest
class UserIndexesTest {

	private static final String TENANT = TenantId.SELF_HOST.value();

	private static final String ADMIN = "admin";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, UserIndexesTest.class, () -> dataDir);
	}

	/** The plain template: the index applies to each write, with or without the tenant limit. */
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
		mongo.insert(user(TENANT, ADMIN));

		assertThatExceptionOfType(DuplicateKeyException.class).isThrownBy(() -> mongo.insert(user(TENANT, ADMIN)));
	}

	@Test
	void insertAllowsTheSameUsernameInAnotherTenant() {
		mongo.insert(user(TENANT, ADMIN));

		mongo.insert(user("other", ADMIN));

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(2);
	}

	@Test
	void insertStopsWhenTwoUsersOfOneTenantHaveTheSameEmail() {
		mongo.insert(user(TENANT, "alice", "shared@example.com"));

		assertThatExceptionOfType(DuplicateKeyException.class)
				.isThrownBy(() -> mongo.insert(user(TENANT, "bob", "shared@example.com")));
	}

	@Test
	void insertStoresTwoUsersWithoutAnEmailWhenTheyAreOfOneTenant() {
		// The email is optional: users without one must not collide in the index of the email.
		mongo.insert(user(TENANT, "alice", null));

		mongo.insert(user(TENANT, "bob", null));

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(2);
	}

	@Test
	void insertStoresTheSameEmailWhenTheUsersAreOfTwoTenants() {
		mongo.insert(user(TENANT, "alice", "shared@example.com"));

		mongo.insert(user("other", "alice", "shared@example.com"));

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(2);
	}

	private static UserDocument user(String tenant, String username) {
		return user(tenant, username, null);
	}

	private static UserDocument user(String tenant, String username, String email) {
		Instant now = Instant.now();
		return new UserDocument(null, tenant, username, email, "{bcrypt}x", Set.of(), false, now, false, false, now);
	}

}

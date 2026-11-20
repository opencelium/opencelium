package io.opencelium.core.auth;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.TenantTasks;
import io.opencelium.core.testsupport.fixture.UserFixture;
import io.opencelium.core.user.UserDocument;
import io.opencelium.core.user.UserService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The lookup of a login finds the OpenCelium user of the name: first the user with that username, compared exactly,
 * then the user with that email, compared without a difference between upper case and lower case. Each test stores
 * users with names of its own, because the users of the test class stay in its database.
 */
@MongoIntegrationTest
class LoginLookupTest {

	private static final String PASSWORD = "Lookup-Password-1";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, LoginLookupTest.class, () -> dataDir);
	}

	@Autowired
	UserService users;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	TenantDocuments documents;

	@Test
	void loadFindsTheUserWhenTheEmailHasUpperCaseLetters() {
		UserDocument frank = UserFixture.aUser("frank", PASSWORD).withEmail("frank@example.com")
				.storeIn(tenantRunner, documents);

		UserDetails found = load("Frank@Example.COM");

		assertThat(found).isInstanceOfSatisfying(LoginUser.class,
				user -> assertThat(user.userId()).isEqualTo(frank.id()));
	}

	@Test
	void loadGivesTheUserOfTheUsernameWhenAnotherUserHasItAsEmail() {
		// The user with the email comes first in the order of the insert and of the username, so that only the order of
		// the lookup gives the user of the username.
		UserFixture.aUser("dora", PASSWORD).withEmail("grace@example.com").storeIn(tenantRunner, documents);
		UserDocument named = UserFixture.aUser("grace@example.com", PASSWORD).storeIn(tenantRunner, documents);

		UserDetails found = load("grace@example.com");

		assertThat(found).isInstanceOfSatisfying(LoginUser.class,
				user -> assertThat(user.userId()).isEqualTo(named.id()));
	}

	@Test
	void loadFindsNoUserWhenTheCaseOfTheUsernameIsDifferent() {
		UserFixture.aUser("ivan", PASSWORD).withEmail("ivan@example.com").storeIn(tenantRunner, documents);

		assertThatExceptionOfType(UsernameNotFoundException.class).isThrownBy(() -> load("Ivan"));
	}

	/** The lookup as the login endpoint runs it: in a request of the self-host tenant. */
	private UserDetails load(String name) {
		var lookup = new LoginLookup(users);
		return TenantTasks.call(tenantRunner, TenantId.SELF_HOST, () -> lookup.loadUserByUsername(name));
	}

}

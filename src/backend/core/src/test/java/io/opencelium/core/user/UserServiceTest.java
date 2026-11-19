package io.opencelium.core.user;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.function.Supplier;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.NoCurrentTenantException;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.TenantTasks;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The user service works on the OpenCelium users of the current tenant. Each call runs through the tenant runner for
 * the self-host tenant, as the start and the lock task run it. A user of another tenant is written and read with the
 * plain template: in the self-host mode the tenant runner runs no other tenant.
 */
@MongoIntegrationTest
class UserServiceTest {

	private static final Instant NOW = Instant.parse("2026-09-28T10:00:00Z");

	private static final String OTHER = "other";

	private static final String ADMIN = "admin";

	private static final String TYPED_PASSWORD = "Typed-Password-1";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, UserServiceTest.class, () -> dataDir);
	}

	@TestBean
	Clock clock;

	static Clock clock() {
		return Clock.fixed(NOW, ZoneOffset.UTC);
	}

	@Autowired
	UserService service;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	PasswordEncoder passwordEncoder;

	@Autowired
	MongoTemplate mongo;

	@BeforeEach
	void removeUsers() {
		mongo.remove(new Query(), UserDocument.class);
	}

	@Test
	void createAdminStoresABcryptHashThatMatchesThePassword() {
		UserCreated created = createAdmin(ADMIN, TYPED_PASSWORD, false);

		UserDocument user = stored(created.id());
		assertThat(user.passwordHash()).startsWith("{bcrypt}");
		assertThat(passwordEncoder.matches(TYPED_PASSWORD, user.passwordHash())).isTrue();
		assertThat(user.roles()).containsExactly(UserService.ADMIN_ROLE);
		assertThat(user.locked()).isFalse();
		assertThat(user.createdAt()).isEqualTo(NOW);
	}

	@Test
	void createAdminStoresTheCurrentTenantWhenTheTenantRunnerBindsOne() {
		UserCreated created = createAdmin(ADMIN, TYPED_PASSWORD, false);

		assertThat(stored(created.id()).tenantId()).isEqualTo("self-host-tenant");
	}

	@Test
	void createAdminStopsWhenNoTenantIsBound() {
		char[] password = TYPED_PASSWORD.toCharArray();

		assertThatExceptionOfType(NoCurrentTenantException.class)
				.isThrownBy(() -> service.createAdmin(new CreateAdminCommand(ADMIN, password, false, false)));
		assertThat(mongo.count(new Query(), UserDocument.class)).isZero();
		assertThat(password).containsOnly('\0');
	}

	@Test
	void createAdminNeverStoresThePasswordInPlainText() {
		createAdmin(ADMIN, "Plain-Text-Canary-42", true);

		Document raw = mongo.getCollection("users").find().first();
		assertThat(raw).isNotNull();
		assertThat(raw.toJson()).doesNotContain("Plain-Text-Canary-42");
	}

	@Test
	void createAdminReturnsTheIdAndUsername() {
		UserCreated created = createAdmin(ADMIN, TYPED_PASSWORD, false);

		assertThat(created.username()).isEqualTo(ADMIN);
		assertThat(stored(created.id()).username()).isEqualTo(ADMIN);
	}

	@Test
	void createAdminRequiresAPasswordChangeWhenThePasswordWasGenerated() {
		UserCreated created = createAdmin(ADMIN, "Generated-Pass-123", true);

		UserDocument user = stored(created.id());
		assertThat(user.mustChangePassword()).isTrue();
		assertThat(user.passwordIssuedAt()).isEqualTo(NOW);
	}

	@Test
	void createAdminRequiresNoPasswordChangeWhenThePasswordWasTyped() {
		UserCreated created = createAdmin(ADMIN, TYPED_PASSWORD, false);

		assertThat(stored(created.id()).mustChangePassword()).isFalse();
	}

	@Test
	void createAdminStoresTheTemporaryFlag() {
		UserCreated created = asSelfHost(() -> service.createAdmin(
				new CreateAdminCommand("operator", "Generated-Pass-123".toCharArray(), true, true)));

		assertThat(stored(created.id()).temporary()).isTrue();
	}

	@Test
	void createAdminThrowsAdminAlreadyExistsExceptionWhenTheTenantHasAnAdmin() {
		createAdmin(ADMIN, TYPED_PASSWORD, false);

		assertThatExceptionOfType(AdminAlreadyExistsException.class)
				.isThrownBy(() -> createAdmin("second", "Typed-Password-2", false))
				.withMessageContaining("self-host-tenant");
		assertThat(mongo.count(new Query(where("username").is("second")), UserDocument.class)).isZero();
	}

	@Test
	void createAdminAllowsTheSameUsernameInAnotherTenant() {
		storeUserOfAnotherTenant(ADMIN, Set.of(UserService.ADMIN_ROLE), false, NOW);

		UserCreated created = createAdmin(ADMIN, TYPED_PASSWORD, false);

		assertThat(stored(created.id()).username()).isEqualTo(ADMIN);
		assertThat(mongo.count(new Query(where("username").is(ADMIN)), UserDocument.class)).isEqualTo(2);
	}

	@Test
	void createAdminZeroesThePassword() {
		char[] password = TYPED_PASSWORD.toCharArray();

		asSelfHost(() -> service.createAdmin(new CreateAdminCommand(ADMIN, password, false, false)));

		assertThat(password).containsOnly('\0');
	}

	@Test
	void createAdminZeroesThePasswordAlsoWhenItFails() {
		createAdmin(ADMIN, TYPED_PASSWORD, false);
		char[] password = "Typed-Password-2".toCharArray();

		assertThatExceptionOfType(AdminAlreadyExistsException.class).isThrownBy(
				() -> asSelfHost(() -> service.createAdmin(new CreateAdminCommand("second", password, false, false))));
		assertThat(password).containsOnly('\0');
	}

	@Test
	void adminExistsIsTrueWhenTheCurrentTenantHasAnAdmin() {
		createAdmin(ADMIN, TYPED_PASSWORD, false);

		boolean exists = asSelfHost(service::adminExists);

		assertThat(exists).isTrue();
	}

	@Test
	void adminExistsIsFalseWhenOnlyAnotherTenantHasAnAdmin() {
		storeUserOfAnotherTenant(ADMIN, Set.of(UserService.ADMIN_ROLE), false, NOW);

		boolean exists = asSelfHost(service::adminExists);

		assertThat(exists).isFalse();
	}

	@Test
	void anyUserExistsIsTrueWhenTheCurrentTenantHasAUser() {
		createAdmin(ADMIN, TYPED_PASSWORD, false);

		boolean exists = asSelfHost(service::anyUserExists);

		assertThat(exists).isTrue();
	}

	@Test
	void anyUserExistsIsFalseWhenOnlyAnotherTenantHasAUser() {
		storeUserOfAnotherTenant("alice", Set.of("USER"), false, NOW);

		boolean exists = asSelfHost(service::anyUserExists);

		assertThat(exists).isFalse();
	}

	@Test
	void changePasswordStoresTheNewHashAndClearsTheChangeRequirement() {
		UserCreated created = createAdmin(ADMIN, "Generated-Pass-123", true);
		char[] newPassword = "Chosen-Password-9".toCharArray();

		tenantRunner.run(TenantId.SELF_HOST, () -> service.changePassword(created.id(), newPassword));

		UserDocument user = stored(created.id());
		assertThat(passwordEncoder.matches("Chosen-Password-9", user.passwordHash())).isTrue();
		assertThat(passwordEncoder.matches("Generated-Pass-123", user.passwordHash())).isFalse();
		assertThat(user.mustChangePassword()).isFalse();
		assertThat(user.passwordIssuedAt()).isEqualTo(NOW);
		assertThat(newPassword).containsOnly('\0');
	}

	@Test
	void changePasswordThrowsNoSuchElementExceptionForAnUnknownUser() {
		char[] newPassword = "Chosen-Password-9".toCharArray();

		assertThatExceptionOfType(NoSuchElementException.class).isThrownBy(() -> tenantRunner
				.run(TenantId.SELF_HOST, () -> service.changePassword("0123456789abcdef01234567", newPassword)));
		assertThat(newPassword).containsOnly('\0');
	}

	@Test
	void changePasswordChangesNoUserWhenTheUserIsOfAnotherTenant() {
		UserDocument other = storeUserOfAnotherTenant(ADMIN, Set.of(UserService.ADMIN_ROLE), true, NOW);
		char[] newPassword = "Chosen-Password-9".toCharArray();

		assertThatExceptionOfType(NoSuchElementException.class).isThrownBy(
				() -> tenantRunner.run(TenantId.SELF_HOST, () -> service.changePassword(other.id(), newPassword)));
		assertThat(stored(other.id())).isEqualTo(other);
	}

	@Test
	void lockExpiredGeneratedPasswordsLocksNoUserWhenTheUserIsOfAnotherTenant() {
		UserDocument other = storeUserOfAnotherTenant(ADMIN, Set.of(), true, NOW.minus(Duration.ofHours(25)));

		int locked = asSelfHost(service::lockExpiredGeneratedPasswords);

		assertThat(locked).isZero();
		assertThat(stored(other.id()).locked()).isFalse();
	}

	private UserCreated createAdmin(String username, String password, boolean generated) {
		return asSelfHost(() -> service
				.createAdmin(new CreateAdminCommand(username, password.toCharArray(), generated, false)));
	}

	private <T> T asSelfHost(Supplier<T> step) {
		return TenantTasks.call(tenantRunner, TenantId.SELF_HOST, step);
	}

	/** Reads with the plain template, without the tenant limit. */
	private UserDocument stored(String id) {
		UserDocument user = mongo.findById(id, UserDocument.class);
		assertThat(user).as("the user %s", id).isNotNull();
		return user;
	}

	/** Writes with the plain template: in the self-host mode no work runs for another tenant. */
	private UserDocument storeUserOfAnotherTenant(String username, Set<String> roles, boolean generated,
			Instant passwordIssuedAt) {
		return mongo.insert(new UserDocument(null, OTHER, username, "{noop}x", roles, generated, passwordIssuedAt,
				false, false, passwordIssuedAt));
	}

}

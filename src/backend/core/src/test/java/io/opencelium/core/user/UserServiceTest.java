package io.opencelium.core.user;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.NoSuchElementException;

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
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

@MongoIntegrationTest
class UserServiceTest {

	private static final Instant NOW = Instant.parse("2026-09-28T10:00:00Z");

	private static final TenantId OTHER = TenantId.of("other");

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
	UserRepository users;

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
		UserCreated created = service.createAdmin(command(TenantId.SELF, "admin", "Typed-Password-1", false));

		UserDocument user = users.findById(created.id()).orElseThrow();
		assertThat(user.passwordHash()).startsWith("{bcrypt}");
		assertThat(passwordEncoder.matches("Typed-Password-1", user.passwordHash())).isTrue();
		assertThat(user.roles()).containsExactly(UserService.ADMIN_ROLE);
		assertThat(user.tenantId()).isEqualTo("self");
		assertThat(user.locked()).isFalse();
		assertThat(user.createdAt()).isEqualTo(NOW);
	}

	@Test
	void createAdminNeverStoresThePasswordInPlainText() {
		service.createAdmin(command(TenantId.SELF, "admin", "Plain-Text-Canary-42", true));

		Document raw = mongo.getCollection("users").find().first();
		assertThat(raw).isNotNull();
		assertThat(raw.toJson()).doesNotContain("Plain-Text-Canary-42");
	}

	@Test
	void createAdminReturnsTheIdAndUsername() {
		UserCreated created = service.createAdmin(command(TenantId.SELF, "admin", "Typed-Password-1", false));

		assertThat(created.username()).isEqualTo("admin");
		assertThat(users.findByTenantIdAndUsername("self", "admin")).get().extracting(UserDocument::id)
				.isEqualTo(created.id());
	}

	@Test
	void createAdminRequiresAPasswordChangeWhenThePasswordWasGenerated() {
		UserCreated created = service.createAdmin(command(TenantId.SELF, "admin", "Generated-Pass-123", true));

		UserDocument user = users.findById(created.id()).orElseThrow();
		assertThat(user.mustChangePassword()).isTrue();
		assertThat(user.passwordIssuedAt()).isEqualTo(NOW);
	}

	@Test
	void createAdminRequiresNoPasswordChangeWhenThePasswordWasTyped() {
		UserCreated created = service.createAdmin(command(TenantId.SELF, "admin", "Typed-Password-1", false));

		assertThat(users.findById(created.id()).orElseThrow().mustChangePassword()).isFalse();
	}

	@Test
	void createAdminStoresTheTemporaryFlag() {
		UserCreated created = service.createAdmin(
				new CreateAdminCommand(OTHER, "operator", "Generated-Pass-123".toCharArray(), true, true));

		assertThat(users.findById(created.id()).orElseThrow().temporary()).isTrue();
	}

	@Test
	void createAdminThrowsAdminAlreadyExistsExceptionWhenTheTenantHasAnAdmin() {
		service.createAdmin(command(TenantId.SELF, "admin", "Typed-Password-1", false));

		assertThatExceptionOfType(AdminAlreadyExistsException.class)
				.isThrownBy(() -> service.createAdmin(command(TenantId.SELF, "second", "Typed-Password-2", false)))
				.withMessageContaining("self");
		assertThat(users.findByTenantIdAndUsername("self", "second")).isEmpty();
	}

	@Test
	void createAdminAllowsTheSameUsernameInAnotherTenant() {
		service.createAdmin(command(TenantId.SELF, "admin", "Typed-Password-1", false));

		service.createAdmin(command(OTHER, "admin", "Typed-Password-2", false));

		assertThat(users.findByTenantIdAndUsername("other", "admin")).isPresent();
	}

	@Test
	void createAdminZeroesThePassword() {
		char[] password = "Typed-Password-1".toCharArray();

		service.createAdmin(new CreateAdminCommand(TenantId.SELF, "admin", password, false, false));

		assertThat(password).containsOnly('\0');
	}

	@Test
	void createAdminZeroesThePasswordAlsoWhenItFails() {
		service.createAdmin(command(TenantId.SELF, "admin", "Typed-Password-1", false));
		char[] password = "Typed-Password-2".toCharArray();

		assertThatExceptionOfType(AdminAlreadyExistsException.class).isThrownBy(
				() -> service.createAdmin(new CreateAdminCommand(TenantId.SELF, "second", password, false, false)));
		assertThat(password).containsOnly('\0');
	}

	@Test
	void adminExistsIsTrueOnlyForATenantWithAnAdmin() {
		service.createAdmin(command(TenantId.SELF, "admin", "Typed-Password-1", false));

		assertThat(service.adminExists(TenantId.SELF)).isTrue();
		assertThat(service.adminExists(OTHER)).isFalse();
	}

	@Test
	void changePasswordStoresTheNewHashAndClearsTheChangeRequirement() {
		UserCreated created = service.createAdmin(command(TenantId.SELF, "admin", "Generated-Pass-123", true));
		char[] newPassword = "Chosen-Password-9".toCharArray();

		service.changePassword(created.id(), newPassword);

		UserDocument user = users.findById(created.id()).orElseThrow();
		assertThat(passwordEncoder.matches("Chosen-Password-9", user.passwordHash())).isTrue();
		assertThat(passwordEncoder.matches("Generated-Pass-123", user.passwordHash())).isFalse();
		assertThat(user.mustChangePassword()).isFalse();
		assertThat(user.passwordIssuedAt()).isEqualTo(NOW);
		assertThat(newPassword).containsOnly('\0');
	}

	@Test
	void changePasswordThrowsNoSuchElementExceptionForAnUnknownUser() {
		char[] newPassword = "Chosen-Password-9".toCharArray();

		assertThatExceptionOfType(NoSuchElementException.class)
				.isThrownBy(() -> service.changePassword("0123456789abcdef01234567", newPassword));
		assertThat(newPassword).containsOnly('\0');
	}

	private static CreateAdminCommand command(TenantId tenant, String username, String password, boolean generated) {
		return new CreateAdminCommand(tenant, username, password.toCharArray(), generated, false);
	}

}

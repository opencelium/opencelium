package io.opencelium.core.user;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MutableClock;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(OutputCaptureExtension.class)
class GeneratedPasswordLockJobTest {

	private static final Instant START = Instant.parse("2026-09-28T10:00:00Z");

	private static final MutableClock CLOCK = new MutableClock(START);

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		registry.add("opencelium.data-dir", () -> dataDir.toString());
		LocalMongo.register(registry, GeneratedPasswordLockJobTest.class);
	}

	@AfterAll
	static void dropDatabase() {
		LocalMongo.drop(GeneratedPasswordLockJobTest.class);
	}

	@TestBean
	Clock clock;

	static Clock clock() {
		return CLOCK;
	}

	@Autowired
	GeneratedPasswordLockJob job;

	@Autowired
	UserService service;

	@Autowired
	UserRepository users;

	@Autowired
	MongoTemplate mongo;

	@BeforeEach
	void reset() {
		mongo.remove(new Query(), UserDocument.class);
		CLOCK.set(START);
	}

	@Test
	void jobDoesNotLockAGeneratedPasswordAfter23Hours() {
		String id = createAdmin(true);
		CLOCK.advance(Duration.ofHours(23));

		job.lockExpiredGeneratedPasswords();

		assertThat(locked(id)).isFalse();
	}

	@Test
	void jobLocksAGeneratedPasswordAfter25HoursAndLogsTheUsername(CapturedOutput output) {
		String id = createAdmin(true);
		CLOCK.advance(Duration.ofHours(25));

		job.lockExpiredGeneratedPasswords();

		assertThat(locked(id)).isTrue();
		assertThat(output).contains("Locked user 'admin' of tenant self: its generated password was not changed"
				+ " within 24 h");
	}

	@Test
	void jobDoesNotLockATypedPasswordAfter25Hours() {
		String id = createAdmin(false);
		CLOCK.advance(Duration.ofHours(25));

		job.lockExpiredGeneratedPasswords();

		assertThat(locked(id)).isFalse();
	}

	@Test
	void jobDoesNotLockAGeneratedPasswordThatWasChanged() {
		String id = createAdmin(true);
		CLOCK.advance(Duration.ofHours(1));
		service.changePassword(id, "Chosen-Password-9".toCharArray());
		CLOCK.advance(Duration.ofHours(24));

		job.lockExpiredGeneratedPasswords();

		assertThat(locked(id)).isFalse();
	}

	@Test
	void lockExpiredGeneratedPasswordsLocksEachUserOnce() {
		createAdmin(true);
		CLOCK.advance(Duration.ofHours(25));

		assertThat(service.lockExpiredGeneratedPasswords()).isEqualTo(1);
		assertThat(service.lockExpiredGeneratedPasswords()).isZero();
	}

	@Test
	void changePasswordUnlocksALockedUser() {
		String id = createAdmin(true);
		CLOCK.advance(Duration.ofHours(25));
		job.lockExpiredGeneratedPasswords();

		service.changePassword(id, "Chosen-Password-9".toCharArray());

		assertThat(locked(id)).isFalse();
	}

	private String createAdmin(boolean generated) {
		return service.createAdmin(new CreateAdminCommand(TenantId.SELF, "admin", "Some-Password-1".toCharArray(),
				generated, false)).id();
	}

	private boolean locked(String id) {
		return users.findById(id).orElseThrow().locked();
	}

}

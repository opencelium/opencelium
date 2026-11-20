package io.opencelium.core.auth;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.MutableClock;
import io.opencelium.core.testsupport.TenantTasks;
import io.opencelium.core.testsupport.fixture.UserFixture;
import io.opencelium.core.user.UserDocument;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * A session keeps its state in a session record of the tenant of its OpenCelium user. A refresh gives 2 new tokens
 * only for the current refresh token of a session that did not reach its end; a second use of an old refresh token,
 * and a refresh for a locked or deleted OpenCelium user, end the session. The service runs through the tenant runner,
 * as it runs in a request.
 * <p>
 * The clock of core starts at the real time: MongoDB removes a session record after its end by the real time, and a
 * record of a clock in the past could disappear during a test.
 */
@MongoIntegrationTest
class SessionServiceTest {

	private static final Instant START = Instant.now().truncatedTo(ChronoUnit.SECONDS);

	private static final MutableClock CLOCK = new MutableClock(START);

	private static final Duration SESSION_LIFETIME = Duration.ofHours(24);

	private static final Duration SESSION_JWT_LIFETIME = Duration.ofMinutes(15);

	private static final Duration REFRESH_TOKEN_LIFETIME = Duration.ofHours(5);

	/** Each round is a new session with 2 refreshes at the same time; more rounds give more orders of the 2. */
	private static final int PARALLEL_ROUNDS = 20;

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, SessionServiceTest.class, () -> dataDir);
	}

	@TestBean
	Clock clock;

	static Clock clock() {
		return CLOCK;
	}

	@Autowired
	SessionService sessions;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	TenantDocuments documents;

	@Autowired
	MongoTemplate mongo;

	private UserDocument alice;

	@BeforeEach
	void storeAUserWithoutASession() {
		CLOCK.set(START);
		mongo.remove(new Query(), SessionRecord.class);
		mongo.remove(query(where("username").is("alice")), UserDocument.class);
		alice = UserFixture.aUser("alice", "Alice-Password-1").storeIn(tenantRunner, documents);
	}

	@Test
	void startStoresASessionRecordWhenAUserLogsIn() {
		IssuedTokens issued = start(alice);

		SessionRecord record = recordOf(issued.sessionJwt());
		assertThat(record).as("the session record of the session JWT").isNotNull();
		assertThat(record.tenantId()).isEqualTo(TenantId.SELF_HOST.value());
		assertThat(record.userId()).isEqualTo(alice.id());
		assertThat(record.tokenId()).isEqualTo(issued.refreshToken().getId());
		assertThat(record.startedAt()).isEqualTo(START);
		assertThat(record.endsAt()).isEqualTo(START.plus(SESSION_LIFETIME));
		assertThat(sessionIdOf(issued.refreshToken())).isEqualTo(record.id());
	}

	@Test
	void refreshGivesNewTokensWhenTheRefreshTokenIsTheCurrentToken() {
		IssuedTokens issued = start(alice);
		Instant later = START.plus(Duration.ofMinutes(10));
		CLOCK.set(later);
		// A change of the roles during the session: the new session JWT carries the roles that the user has now.
		mongo.updateFirst(query(where("_id").is(alice.id())), new Update().set("roles", List.of("ADMIN")),
				UserDocument.class);

		IssuedTokens refreshed = refresh(issued.refreshToken());

		assertThat(refreshed.sessionJwt().getSubject()).isEqualTo(alice.id());
		assertThat(issued.sessionJwt().getClaimAsStringList("roles")).as("the roles at the login").isEmpty();
		assertThat(refreshed.sessionJwt().getClaimAsStringList("roles")).containsExactly("ADMIN");
		assertThat(sessionIdOf(refreshed.sessionJwt())).isEqualTo(sessionIdOf(issued.sessionJwt()));
		assertThat(sessionIdOf(refreshed.refreshToken())).isEqualTo(sessionIdOf(issued.sessionJwt()));
		assertThat(refreshed.refreshToken().getId()).isNotEqualTo(issued.refreshToken().getId());
		assertThat(refreshed.sessionJwt().getExpiresAt()).isEqualTo(later.plus(SESSION_JWT_LIFETIME));
		assertThat(refreshed.refreshToken().getExpiresAt()).isEqualTo(later.plus(REFRESH_TOKEN_LIFETIME));
		assertThat(refresh(refreshed.refreshToken()).sessionJwt()).as("a refresh with the new refresh token")
				.isNotNull();
	}

	@Test
	void refreshEndsTheSessionWhenAnOldRefreshTokenComesAgain() {
		IssuedTokens issued = start(alice);
		IssuedTokens refreshed = refresh(issued.refreshToken());

		assertThatExceptionOfType(SessionEndedException.class).isThrownBy(() -> refresh(issued.refreshToken()));

		assertThat(recordOf(issued.sessionJwt())).as("the session record").isNull();
		assertThatExceptionOfType(SessionEndedException.class).as("a refresh with the new refresh token")
				.isThrownBy(() -> refresh(refreshed.refreshToken()));
	}

	@Test
	void refreshEndsTheSessionWhenTwoRefreshesUseOneToken() throws Exception {
		try (ExecutorService threads = Executors.newVirtualThreadPerTaskExecutor()) {
			for (int round = 1; round <= PARALLEL_ROUNDS; round++) {
				IssuedTokens issued = start(alice);
				var together = new CyclicBarrier(2);
				Callable<Optional<IssuedTokens>> attempt = () -> {
					together.await(10, TimeUnit.SECONDS);
					try {
						return Optional.of(refresh(issued.refreshToken()));
					}
					catch (SessionEndedException ended) {
						return Optional.empty();
					}
				};
				Future<Optional<IssuedTokens>> first = threads.submit(attempt);
				Future<Optional<IssuedTokens>> second = threads.submit(attempt);
				List<Optional<IssuedTokens>> results = List.of(first.get(30, TimeUnit.SECONDS),
						second.get(30, TimeUnit.SECONDS));

				assertThat(results).as("round %d: the refreshes that gave tokens", round)
						.filteredOn(Optional::isPresent).hasSize(1);
				assertThat(recordOf(issued.sessionJwt())).as("round %d: the session record", round).isNull();
				IssuedTokens winner = results.stream().flatMap(Optional::stream).findFirst().orElseThrow();
				assertThatExceptionOfType(SessionEndedException.class)
						.as("round %d: a refresh with the refresh token of the first refresh", round)
						.isThrownBy(() -> refresh(winner.refreshToken()));
			}
		}
	}

	@Test
	void refreshEndsTheSessionWhenTheUserIsLocked() {
		IssuedTokens issued = start(alice);
		mongo.updateFirst(query(where("_id").is(alice.id())), new Update().set("locked", true), UserDocument.class);

		assertThatExceptionOfType(SessionEndedException.class).isThrownBy(() -> refresh(issued.refreshToken()));

		assertThat(recordOf(issued.sessionJwt())).as("the session record").isNull();
	}

	@Test
	void refreshEndsTheSessionWhenTheUserIsDeleted() {
		IssuedTokens issued = start(alice);
		mongo.remove(query(where("_id").is(alice.id())), UserDocument.class);

		assertThatExceptionOfType(SessionEndedException.class).isThrownBy(() -> refresh(issued.refreshToken()));

		assertThat(recordOf(issued.sessionJwt())).as("the session record").isNull();
	}

	@Test
	void refreshStopsWhenTheEndOfTheSessionIsPast() {
		// The decoder refuses an expired refresh token before the service gets it. The service compares the end
		// itself too: MongoDB removes a record after its end only by the real time, approximately each 60 s.
		IssuedTokens issued = start(alice);
		CLOCK.set(START.plus(SESSION_LIFETIME).plusSeconds(1));
		assertThat(recordOf(issued.sessionJwt())).as("the session record after the end by the clock of core")
				.isNotNull();

		assertThatExceptionOfType(SessionEndedException.class).isThrownBy(() -> refresh(issued.refreshToken()));
	}

	@Test
	void refreshGivesNoTokenThatExpiresAfterTheEndOfTheSession() {
		Instant end = START.plus(SESSION_LIFETIME);
		IssuedTokens tokens = start(alice);

		// A refresh before each refresh token expires, until the last minutes of the session.
		for (Duration after : List.of(Duration.ofHours(4), Duration.ofHours(8), Duration.ofHours(12),
				Duration.ofHours(16), Duration.ofHours(20), Duration.ofHours(23).plusMinutes(50))) {
			CLOCK.set(START.plus(after));
			tokens = refresh(tokens.refreshToken());
			assertThat(tokens.sessionJwt().getExpiresAt()).as("the session JWT of the refresh after %s", after)
					.isBeforeOrEqualTo(end);
			assertThat(tokens.refreshToken().getExpiresAt()).as("the refresh token of the refresh after %s", after)
					.isBeforeOrEqualTo(end);
		}

		assertThat(tokens.sessionJwt().getExpiresAt()).isEqualTo(end);
		assertThat(tokens.refreshToken().getExpiresAt()).isEqualTo(end);
		assertThat(recordOf(tokens.sessionJwt()).endsAt()).isEqualTo(end);
	}

	@Test
	void endDeletesTheSessionRecord() {
		IssuedTokens issued = start(alice);

		end(issued.refreshToken());

		assertThat(recordOf(issued.sessionJwt())).as("the session record").isNull();
		assertThatExceptionOfType(SessionEndedException.class).isThrownBy(() -> refresh(issued.refreshToken()));
	}

	private IssuedTokens start(UserDocument user) {
		return inTheTenant(() -> sessions.start(LoginUser.of(user)));
	}

	private IssuedTokens refresh(Jwt refreshToken) {
		return inTheTenant(() -> sessions.refresh(refreshToken));
	}

	private void end(Jwt refreshToken) {
		inTheTenant(() -> {
			sessions.end(refreshToken);
			return null;
		});
	}

	private <T> T inTheTenant(Supplier<T> step) {
		return TenantTasks.call(tenantRunner, TenantId.SELF_HOST, step);
	}

	/** The stored session record of the session of the token, or {@code null}. */
	private SessionRecord recordOf(Jwt token) {
		return mongo.findById(sessionIdOf(token), SessionRecord.class);
	}

	private static String sessionIdOf(Jwt token) {
		return token.getClaimAsString("sid");
	}

}

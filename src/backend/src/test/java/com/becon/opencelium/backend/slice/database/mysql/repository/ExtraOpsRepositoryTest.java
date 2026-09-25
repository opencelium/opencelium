package com.becon.opencelium.backend.slice.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.ExtraOpsRepository;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.ActivationRequestFixture;
import com.becon.opencelium.backend.testutil.fixture.ExtraOpsFixture;
import com.becon.opencelium.backend.testutil.fixture.SubscriptionFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SliceTest
@DisplayName("ExtraOpsRepository — JPA slice")
class ExtraOpsRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private ExtraOpsRepository repository;

    private static final long GENERATED_AT = 1_700_000_000_000L;

    // ── existsByStatus ───────────────────────────────────────────────────────

    @Test
    void existsByStatusReturnsTrueWhenMatchingExtraOpsExists() {
        // GIVEN
        persistAndFlush(ExtraOpsStatus.ACTIVE, GENERATED_AT);

        // WHEN-THEN
        assertThat(repository.existsByStatus(ExtraOpsStatus.ACTIVE)).isTrue();
    }

    @Test
    void existsByStatusReturnsFalseWhenOnlyDifferentStatusExists() {
        // GIVEN
        persistAndFlush(ExtraOpsStatus.PENDING, GENERATED_AT);

        // WHEN-THEN
        assertThat(repository.existsByStatus(ExtraOpsStatus.ACTIVE)).isFalse();
    }

    // ── existsByGeneratedAt ──────────────────────────────────────────────────

    @Test
    void existsByGeneratedAtReturnsTrueWhenMatchingExtraOpsExists() {
        // GIVEN
        persistAndFlush(ExtraOpsStatus.PENDING, GENERATED_AT);

        // WHEN-THEN
        assertThat(repository.existsByGeneratedAt(GENERATED_AT)).isTrue();
    }

    @Test
    void existsByGeneratedAtReturnsFalseWhenTimestampDoesNotMatch() {
        // GIVEN
        persistAndFlush(ExtraOpsStatus.PENDING, GENERATED_AT);

        // WHEN-THEN
        assertThat(repository.existsByGeneratedAt(GENERATED_AT + 1)).isFalse();
    }

    // ── findAndLockById ──────────────────────────────────────────────────────

    @Test
    void findAndLockByIdReturnsExtraOpsWhenIdExists() {
        // GIVEN
        ExtraOps extraOps = persistAndFlush(ExtraOpsStatus.ACTIVE, GENERATED_AT);
        Long id = extraOps.getId();
        em.clear();

        // WHEN
        Optional<ExtraOps> result = repository.findAndLockById(id);

        // THEN
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(id);
    }

    @Test
    void findAndLockByIdReturnsEmptyWhenIdDoesNotExist() {
        // GIVEN
        Long id = Long.MAX_VALUE;

        // WHEN-THEN
        assertThat(repository.findAndLockById(id)).isEmpty();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ExtraOps persistAndFlush(ExtraOpsStatus status, long generatedAt) {
        ActivationRequest activationRequest = em.persist(
                ActivationRequestFixture.anActivationRequest(ActivReqStatus.PROCESSED, true)
        );

        Subscription subscription = em.persist(
                SubscriptionFixture.aSubscription(
                        UUID.randomUUID().toString(),
                        "license-" + UUID.randomUUID(),
                        true,
                        activationRequest
                )
        );

        return em.persistAndFlush(
                ExtraOpsFixture.anExtraOps(subscription, status, generatedAt)
        );
    }
}

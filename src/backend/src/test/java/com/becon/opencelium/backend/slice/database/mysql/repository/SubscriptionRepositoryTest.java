package com.becon.opencelium.backend.slice.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.SubscriptionRepository;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.ActivationRequestFixture;
import com.becon.opencelium.backend.testutil.fixture.SubscriptionFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JPA slice tests for {@link SubscriptionRepository}.
 * <p>
 * These tests run against H2 because the repository contains custom JPQL and
 * native queries for subscription actions that cannot be verified with mocks.
 * <p>
 * Run with: ./gradlew test --tests "*.SubscriptionRepositoryTest"
 */
@SliceTest
@DisplayName("SubscriptionRepository — JPA slice")
class SubscriptionRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private SubscriptionRepository repository;

    // ── deactivateAll ────────────────────────────────────────────────────────

    @Test
    void deactivateAllMarksEverySubscriptionInactive() {
        // GIVEN
        persistAndFlush("license-1", true);
        persistAndFlush("license-2", true);
        persistAndFlush("license-3", false);

        // WHEN
        repository.deactivateAll();
        em.flush();
        em.clear();

        // THEN
        assertThat(repository.findAll())
                .extracting(Subscription::isActive)
                .containsOnly(false);
    }

    // ── deleteByLicenseId ────────────────────────────────────────────────────

    @Test
    void deleteByLicenseIdDeletesSubscriptionWhenLicenseIdMatches() {
        // GIVEN
        persistAndFlush("license-1", true);
        persistAndFlush("license-2", true);

        // WHEN
        repository.deleteByLicenseId("license-1");
        em.flush();
        em.clear();

        // THEN
        assertThat(repository.findByLicenseId("license-1")).isEmpty();
        assertThat(repository.findByLicenseId("license-2")).isPresent();
    }

    // ── deleteBySubId ────────────────────────────────────────────────────────

    @Test
    void deleteBySubIdDeletesSubscriptionWhenSubIdMatches() {
        // GIVEN
        Subscription subscription1 = persistAndFlush("license-1", true);
        Subscription subscription2 = persistAndFlush("license-2", true);

        String subId1 = subscription1.getSubId();
        String subId2 = subscription2.getSubId();

        // WHEN
        repository.deleteBySubId(subId1);
        em.flush();
        em.clear();

        // THEN
        assertThat(repository.findBySubId(subId1)).isEmpty();
        assertThat(repository.findBySubId(subId2)).isPresent();
    }

    // ── findFirstByActiveTrue ────────────────────────────────────────────────

    @Test
    void findFirstByActiveTrueReturnsSubscriptionWhenActiveEntryExists() {
        // GIVEN
        persistAndFlush("license-inactive", false);
        Subscription active = persistAndFlush("license-active", true);

        // WHEN
        Optional<Subscription> result = repository.findFirstByActiveTrue();

        // THEN
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(active.getId());
        assertThat(result.get().isActive()).isTrue();
    }

    @Test
    void findFirstByActiveTrueReturnsEmptyWhenNoSubscriptionIsActive() {
        // GIVEN
        persistAndFlush("license-1", false);
        persistAndFlush("license-2", false);

        // WHEN-THEN
        assertThat(repository.findFirstByActiveTrue()).isEmpty();
    }

    // ── findBySubId ──────────────────────────────────────────────────────────

    @Test
    void findBySubIdReturnsSubscriptionWhenMatchExists() {
        // GIVEN
        Subscription subscription = persistAndFlush("license-1", true);

        // WHEN
        Optional<Subscription> result = repository.findBySubId(subscription.getSubId());

        // THEN
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(subscription.getId());
    }

    @Test
    void findBySubIdReturnsEmptyWhenMatchDoesNotExist() {
        // GIVEN
        persistAndFlush("license-1", true);
        String nonExistingSubId = UUID.randomUUID().toString();

        // WHEN-THEN
        assertThat(repository.findBySubId(nonExistingSubId)).isEmpty();
    }

    // ── existsBySubId ────────────────────────────────────────────────────────

    @Test
    void existsBySubIdReturnsTrueWhenSubscriptionExists() {
        // GIVEN
        Subscription subscription = persistAndFlush("license-1", true);

        String subId = subscription.getSubId();

        // WHEN-THEN
        assertThat(repository.existsBySubId(subId)).isTrue();
    }

    @Test
    void existsBySubIdReturnsFalseWhenSubscriptionDoesNotExist() {
        // GIVEN
        String nonExistingSubId = UUID.randomUUID().toString();

        // WHEN-THEN
        assertThat(repository.existsBySubId(nonExistingSubId)).isFalse();
    }

    // ── findByLicenseId ──────────────────────────────────────────────────────

    @Test
    void findByLicenseIdReturnsSubscriptionWhenMatchExists() {
        // GIVEN
        Subscription subscription = persistAndFlush("license-1", true);

        // WHEN
        Optional<Subscription> result = repository.findByLicenseId("license-1");

        // THEN
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(subscription.getId());
    }

    @Test
    void findByLicenseIdReturnsEmptyWhenMatchDoesNotExist() {
        // GIVEN
        persistAndFlush("license-1", true);

        // WHEN-THEN
        assertThat(repository.findByLicenseId("missing-license")).isEmpty();
    }

    // ── findAndLockById ──────────────────────────────────────────────────────

    @Test
    void findAndLockByIdReturnsSubscriptionWhenIdExists() {
        // GIVEN
        Subscription subscription = persistAndFlush("license-1", true);

        // WHEN
        Optional<Subscription> result = repository.findAndLockById(subscription.getId());

        // THEN
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(subscription.getId());
    }

    @Test
    void findAndLockByIdReturnsEmptyWhenIdDoesNotExist() {
        // WHEN-THEN
        assertThat(repository.findAndLockById("missing-id")).isEmpty();
    }


    // ── helpers ──────────────────────────────────────────────────────────────

    private Subscription persistAndFlush(String licenseId, boolean active) {
        ActivationRequest activationRequest = em.persist(
                ActivationRequestFixture.anActivationRequest(ActivReqStatus.PROCESSED, true)
        );

        String subscriptionId = UUID.randomUUID().toString();

        return em.persistAndFlush(
                SubscriptionFixture.aSubscription(subscriptionId, licenseId, active, activationRequest)
        );
    }
}

package com.becon.opencelium.backend.slice.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.repository.ActivationRequestRepository;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JPA slice tests for {@link ActivationRequestRepository}.
 *
 * These tests run against H2 because the repository contains custom JPQL and
 * native queries for activation-request expiry, deactivation, active-request
 * lookup, HMAC lookup, and status updates that cannot be verified with mocks.
 *
 * Run with: ./gradlew test --tests "*.ActivationRequestRepositoryTest"
 */
@SliceTest
@DisplayName("ActivationRequestRepository — JPA slice")
class ActivationRequestRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private ActivationRequestRepository repository;

    // ── expireAllActivationRequests ──────────────────────────────────────────

    @Test
    void expireAllActivationRequestsExpiresOnlyPendingActivationRequests() {
        // GIVEN
        String pendingId = persistAndFlush(ActivReqStatus.PENDING, false)
                .getId();

        String processedId = persistAndFlush(ActivReqStatus.PROCESSED, true)
                .getId();

        String expiredId = persistAndFlush(ActivReqStatus.EXPIRED, false)
                .getId();

        // WHEN
        repository.expireAllActivationRequests();
        em.flush();
        em.clear();

        // THEN
        assertThat(em.find(ActivationRequest.class, pendingId).getStatus())
                .isEqualTo(ActivReqStatus.EXPIRED);
        assertThat(em.find(ActivationRequest.class, processedId).getStatus())
                .isEqualTo(ActivReqStatus.PROCESSED);
        assertThat(em.find(ActivationRequest.class, expiredId).getStatus())
                .isEqualTo(ActivReqStatus.EXPIRED);
    }

    // ── deactivateAll ────────────────────────────────────────────────────────

    @Test
    void deactivateAllMarksEveryActivationRequestInactive() {
        // GIVEN
        persistAndFlush(ActivReqStatus.PENDING, true);
        persistAndFlush(ActivReqStatus.PROCESSED, true);
        persistAndFlush(ActivReqStatus.EXPIRED, false);

        // WHEN
        repository.deactivateAll();
        em.flush();
        em.clear();

        // THEN
        assertThat(repository.findAll())
                .extracting(ActivationRequest::isActive)
                .containsOnly(false);
    }

    // ── findActiveAR ─────────────────────────────────────────────────────────

    @Test
    void findActiveARReturnsActivationRequestWhenActiveEntryExists() {
        // GIVEN
        persistAndFlush(ActivReqStatus.EXPIRED, false);

        ActivationRequest active = persistAndFlush(ActivReqStatus.PROCESSED, true);
        String activeId = active.getId();

        // WHEN
        Optional<ActivationRequest> result = repository.findActiveAR();

        // THEN
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(activeId);
        assertThat(result.get().isActive()).isTrue();
    }

    @Test
    void findActiveARReturnsEmptyWhenNoActivationRequestIsActive() {
        // GIVEN
        persistAndFlush(ActivReqStatus.PENDING, false);
        persistAndFlush(ActivReqStatus.EXPIRED, false);

        // WHEN-THEN
        assertThat(repository.findActiveAR()).isEmpty();
    }

    // ── findFirstByHmac ──────────────────────────────────────────────────────

    @Test
    void findFirstByHmacReturnsActivationRequestWhenMatchExists() {
        // GIVEN
        ActivationRequest request = persistAndFlush(ActivReqStatus.PENDING,false);
        String id = request.getId();
        String hmac = request.getHmac();

        // WHEN
        Optional<ActivationRequest> result = repository.findFirstByHmac(hmac);

        // THEN
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(id);
        assertThat(result.get().getHmac()).isEqualTo(hmac);
    }

    @Test
    void findFirstByHmacReturnsEmptyWhenMatchDoesNotExist() {
        // GIVEN
        persistAndFlush(ActivReqStatus.PENDING, false);

        // WHEN-THEN
        assertThat(repository.findFirstByHmac("nonexisting-hmac")).isEmpty();
    }

    // ── updateStatusIfNotProcessed ───────────────────────────────────────────

    @Test
    void updateStatusIfNotProcessedUpdatesStatusWhenActivationRequestIsPending() {
        // GIVEN
        ActivationRequest request = persistAndFlush(ActivReqStatus.PENDING, false);
        String id = request.getId();

        // WHEN
        repository.updateStatusIfNotProcessed(
                id,
                ActivReqStatus.EXPIRED,
                ActivReqStatus.PROCESSED
        );
        em.flush();
        em.clear();

        // THEN
        ActivationRequest result = em.find(ActivationRequest.class, id);
        assertThat(result.getStatus()).isEqualTo(ActivReqStatus.EXPIRED);
    }

    @Test
    void updateStatusIfNotProcessedLeavesStatusUnchangedWhenActivationRequestIsProcessed() {
        // GIVEN
        ActivationRequest request = persistAndFlush(ActivReqStatus.PROCESSED, true);
        String id = request.getId();

        // WHEN
        repository.updateStatusIfNotProcessed(
                id,
                ActivReqStatus.EXPIRED,
                ActivReqStatus.PROCESSED
        );
        em.flush();
        em.clear();

        // THEN
        ActivationRequest result = em.find(ActivationRequest.class, id);
        assertThat(result.getStatus()).isEqualTo(ActivReqStatus.PROCESSED);
    }

    @Test
    void updateStatusIfNotProcessedDoesNothingWhenActivationRequestDoesNotExist() {
        // WHEN
        repository.updateStatusIfNotProcessed(
                UUID.randomUUID().toString(), // non-existing id
                ActivReqStatus.EXPIRED,
                ActivReqStatus.PROCESSED
        );
        em.flush();
        em.clear();

        // THEN
        assertThat(repository.findAll()).isEmpty();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ActivationRequest persistAndFlush(ActivReqStatus status, boolean active) {
        String hmac = "hmac-" + status + (active ? "-active" : "-inactive");

        ActivationRequest request = new ActivationRequest();

        request.setId(UUID.randomUUID().toString());
        request.setHmac(hmac);
        request.setStatus(status);
        request.setActive(active);
        request.setTtl(3600);
        request.setCreatedAt(LocalDateTime.now());

        return em.persistAndFlush(request);
    }
}

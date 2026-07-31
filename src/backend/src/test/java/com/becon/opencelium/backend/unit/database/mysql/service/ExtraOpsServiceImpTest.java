package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.ExtraOpsRepository;
import com.becon.opencelium.backend.database.mysql.service.ExtraOpsServiceImp;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ExtraOpsServiceImp}.
 *
 * No Spring context is loaded. Repository and scheduler interactions are mocked
 * with Mockito. HMACs are produced with the service's own {@code constructHmac}
 * so the integrity checks inside the service pass for valid fixtures.
 *
 * Focus: {@code updateExtraOpsForSubscription} must cascade leftover usage from a
 * fully-consumed pack into the next available pack, and drop the remainder only
 * when no pack has capacity left.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExtraOpsServiceImp — unit")
class ExtraOpsServiceImpTest {

    @Mock
    private ExtraOpsRepository extraOpsRepository;

    @Mock
    private Scheduler scheduler;

    @InjectMocks
    private ExtraOpsServiceImp service;

    private Subscription subscription;

    private Subscription newSubscription() {
        Subscription sub = new Subscription();
        sub.setId("sub-1");
        sub.setLicenseId("LIC-1");
        sub.setExtraOpsList(new ArrayList<>());
        return sub;
    }

    /** Builds a pack attached to {@code sub}, with valid current/total HMACs, and registers it. */
    private ExtraOps pack(long id, Subscription sub, ExtraOpsStatus status, long total, long current) {
        ExtraOps e = new ExtraOps();
        e.setId(id);
        e.setSubscription(sub);
        e.setGeneratedAt(1000L + id); // unique generatedAt so HMACs differ per pack
        e.setStatus(status);
        e.setStartDate(LocalDateTime.now());
        e.setEndDate(LocalDateTime.now().plusDays(1));
        e.setCreatedAt(LocalDateTime.now());
        e.setTotalOpsUsage(total);
        e.setTotalOpsUsageHmac(service.constructHmac(e, total));
        e.setCurrentOpsUsage(current);
        e.setCurrentOpsUsageHmac(service.constructHmac(e, current));
        sub.getExtraOpsList().add(e);
        return e;
    }

    // ── updateExtraOpsForSubscription ────────────────────────────────────────

    @Test
    @DisplayName("cascades leftover usage to the next pack when the first pack is filled")
    void updateExtraOpsForSubscriptionCascadesToNextPackWhenFirstPackFull() throws SchedulerException {
        // GIVEN: pack A has 10 ops free (ACTIVE), pack B is empty (PENDING)
        subscription = newSubscription();
        ExtraOps a = pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 90);
        ExtraOps b = pack(2L, subscription, ExtraOpsStatus.PENDING, 100, 0);

        when(extraOpsRepository.findAndLockById(1L)).thenReturn(Optional.of(a));
        when(extraOpsRepository.findAndLockById(2L)).thenReturn(Optional.of(b));
        when(extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)).thenReturn(true);
        when(scheduler.checkExists(any(JobKey.class))).thenReturn(true);

        // WHEN: 30 overflow ops are charged (10 fit in A, 20 must spill into B)
        service.updateExtraOpsForSubscription(subscription, 30);

        // THEN: A is fully consumed and B receives the remaining 20
        assertThat(a.getCurrentOpsUsage()).isEqualTo(100);
        assertThat(a.getStatus()).isEqualTo(ExtraOpsStatus.CONSUMED);
        assertThat(b.getCurrentOpsUsage()).isEqualTo(20);
        assertThat(b.getStatus()).isEqualTo(ExtraOpsStatus.ACTIVE);
    }

    @Test
    @DisplayName("fills the only pack and drops the leftover when no capacity remains")
    void updateExtraOpsForSubscriptionDropsLeftoverWhenNoPackHasCapacity() throws SchedulerException {
        // GIVEN: a single pack with 10 ops free
        subscription = newSubscription();
        ExtraOps a = pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 90);

        when(extraOpsRepository.findAndLockById(1L)).thenReturn(Optional.of(a));
        when(extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)).thenReturn(true);
        when(scheduler.checkExists(any(JobKey.class))).thenReturn(true);

        // WHEN: 30 ops charged but only 10 can be absorbed
        service.updateExtraOpsForSubscription(subscription, 30);

        // THEN: pack is consumed; the surplus 20 is silently dropped (agreed behavior)
        assertThat(a.getCurrentOpsUsage()).isEqualTo(100);
        assertThat(a.getStatus()).isEqualTo(ExtraOpsStatus.CONSUMED);
    }

    @Test
    @DisplayName("partially fills a pack and leaves it ACTIVE when it has enough room")
    void updateExtraOpsForSubscriptionPartiallyFillsPackWhenItHasRoom() throws SchedulerException {
        // GIVEN: pack A has 10 ops free
        subscription = newSubscription();
        ExtraOps a = pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 90);

        when(extraOpsRepository.findAndLockById(1L)).thenReturn(Optional.of(a));
        when(extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)).thenReturn(true);
        when(scheduler.checkExists(any(JobKey.class))).thenReturn(true);

        // WHEN: only 5 ops are charged
        service.updateExtraOpsForSubscription(subscription, 5);

        // THEN: usage is incremented and the pack stays ACTIVE
        assertThat(a.getCurrentOpsUsage()).isEqualTo(95);
        assertThat(a.getStatus()).isEqualTo(ExtraOpsStatus.ACTIVE);
    }
}

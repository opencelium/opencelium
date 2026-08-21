package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.ExtraOpsRepository;
import com.becon.opencelium.backend.database.mysql.service.ExtraOpsServiceImp;
import com.becon.opencelium.backend.subscription.dto.EncryptedExtraOpsFile;
import com.becon.opencelium.backend.subscription.dto.ExtraOpsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.Trigger;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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

    // ── save ─────────────────────────────────────────────────────────────────

    @Test
    void saveActivatesPendingPackWhenNoActivePackExists() throws SchedulerException {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.PENDING, 100, 0);
        when(extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)).thenReturn(false);
        when(scheduler.checkExists(any(JobKey.class))).thenReturn(true);

        // WHEN
        service.save(extraOps);

        // THEN
        assertThat(extraOps.getStatus()).isEqualTo(ExtraOpsStatus.ACTIVE);
        verify(extraOpsRepository).save(extraOps);
    }

    @Test
    void saveKeepsPendingPackWhenActivePackExists() throws SchedulerException {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.PENDING, 100, 0);
        when(extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)).thenReturn(true);
        when(scheduler.checkExists(any(JobKey.class))).thenReturn(true);

        // WHEN
        service.save(extraOps);

        // THEN
        assertThat(extraOps.getStatus()).isEqualTo(ExtraOpsStatus.PENDING);
        verify(extraOpsRepository).save(extraOps);
    }

    @Test
    void saveThrowsWhenCurrentOpsUsageHmacIsInvalid() {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.PENDING, 100, 10);
        extraOps.setCurrentOpsUsageHmac("invalid-hmac");

        // WHEN-THEN
        assertThatThrownBy(() -> service.save(extraOps))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Current usage was changed manually in Extra Ops");
        verify(extraOpsRepository, never()).save(any());
        verifyNoInteractions(scheduler);
    }

    @Test
    void saveThrowsWhenTotalOpsUsageHmacIsInvalid() {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.PENDING, 100, 10);
        extraOps.setTotalOpsUsageHmac("invalid-hmac");

        // WHEN-THEN
        assertThatThrownBy(() -> service.save(extraOps))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Total usage was changed manually in Extra Ops");
        verify(extraOpsRepository, never()).save(any());
        verifyNoInteractions(scheduler);
    }

    // save -> scheduling

    @Test
    void saveDoesNotScheduleDuplicateExpiryJob() throws SchedulerException {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 10);
        when(extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)).thenReturn(true);
        when(scheduler.checkExists(new JobKey("ExtraOpsJob-1", "ExtraOpsJobs"))).thenReturn(true);

        // WHEN
        service.save(extraOps);

        // THEN
        verify(scheduler, never()).scheduleJob(any(JobDetail.class), any(Trigger.class));
    }

    @Test
    void saveSchedulesExpiryJobWhenItDoesNotExist() throws SchedulerException {
        // GIVEN
        JobKey extraOpsJobs = new JobKey("ExtraOpsJob-1", "ExtraOpsJobs");

        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 10);
        when(extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)).thenReturn(true);
        when(scheduler.checkExists(extraOpsJobs)).thenReturn(false);

        // WHEN
        service.save(extraOps);

        // THEN
        var jobCaptor = org.mockito.ArgumentCaptor.forClass(JobDetail.class);
        var triggerCaptor = org.mockito.ArgumentCaptor.forClass(Trigger.class);
        verify(scheduler).scheduleJob(jobCaptor.capture(), triggerCaptor.capture());
        assertThat(jobCaptor.getValue().getKey()).isEqualTo(extraOpsJobs);
        assertThat(jobCaptor.getValue().getJobDataMap().getLong("extraOpsId")).isEqualTo(extraOps.getId());
    }

    // ── delete, deleteList, findById, existsByGeneratedAt ────────────────────
    // repository delegation

    @Test
    void deleteDelegatesToRepository() {
        // GIVEN
        Long id = 1L;

        // WHEN
        service.delete(id);

        // THEN
        verify(extraOpsRepository).deleteById(id);
    }

    @Test
    void deleteListDelegatesToRepository() {
        // GIVEN
        List<Long> ids = List.of(1L, 2L);

        // WHEN
        service.deleteList(ids);

        // THEN
        verify(extraOpsRepository).deleteAllById(ids);
    }

    @Test
    void findByIdReturnsRepositoryResult() {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 10);
        when(extraOpsRepository.findById(1L)).thenReturn(Optional.of(extraOps));

        // WHEN
        Optional<ExtraOps> result = service.findById(1L);

        // THEN
        assertThat(result).containsSame(extraOps);
    }

    @Test
    void existsByGeneratedAtReturnsRepositoryResult() {
        // GIVEN
        when(extraOpsRepository.existsByGeneratedAt(1_001L)).thenReturn(true);

        // WHEN
        boolean result = service.existsByGeneratedAt(1_001L);

        // THEN
        assertThat(result).isTrue();
    }

    // ── updateExtraOpsForSubscription ────────────────────────────────────────

    @Test
    void toDTOReturnsMappedFieldsFromExtraOps() {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 10);

        // WHEN
        ExtraOpsDTO result = service.toDTO(extraOps);

        // THEN
        assertThat(result.getId()).isEqualTo(extraOps.getId());
        assertThat(result.getLicenseId()).isEqualTo(subscription.getLicenseId());
        assertThat(result.getTotalOpsUsage()).isEqualTo(extraOps.getTotalOpsUsage());
        assertThat(result.getCurrentOpsUsage()).isEqualTo(extraOps.getCurrentOpsUsage());
        assertThat(result.getActivationDate()).isEqualTo(
                extraOps.getStartDate().atZone(ZoneId.of("UTC")).toInstant().toEpochMilli());
        assertThat(result.getEndDate()).isEqualTo(
                extraOps.getEndDate().atZone(ZoneId.of("UTC")).toInstant().toEpochMilli());
        assertThat(result.getGeneratedAt()).isEqualTo(extraOps.getGeneratedAt());
        assertThat(result.getStatus()).isEqualTo(extraOps.getStatus());
    }

    // ── toEntityFromEncryption ───────────────────────────────────────────────

    @Test
    void toEntityFromEncryptionInitializesExtraOps() {
        // GIVEN
        EncryptedExtraOpsFile encryptedFile = new EncryptedExtraOpsFile();
        encryptedFile.setLicenseId("LIC-1");
        encryptedFile.setGeneratedAt(1_001L);
        encryptedFile.setTotalOpsUsage(100L);
        LicenseKey licenseKey = new LicenseKey();

        // WHEN
        ExtraOps result = service.toEntityFromEncryption(encryptedFile, licenseKey);

        // THEN
        assertThat(result.getStatus()).isEqualTo(ExtraOpsStatus.PENDING);
        assertThat(result.getTotalOpsUsage()).isEqualTo(100L);
        assertThat(result.getTotalOpsUsageHmac()).isEqualTo(service.constructHmac(encryptedFile, 100L));
        assertThat(result.getCurrentOpsUsage()).isZero();
        assertThat(result.getCurrentOpsUsageHmac()).isEqualTo(service.constructHmac(encryptedFile, 0L));
        assertThat(result.getGeneratedAt()).isEqualTo(1_001L);
        assertThat(result.getStartDate()).isNotNull();
        assertThat(result.getEndDate()).isNotNull();
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

    @Test
    void updateExtraOpsForSubscriptionUsesEarliestPendingPack() throws SchedulerException {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps earlier = pack(2L, subscription, ExtraOpsStatus.PENDING, 100, 0);
        ExtraOps later = pack(1L, subscription, ExtraOpsStatus.PENDING, 100, 0);
        when(extraOpsRepository.findAndLockById(2L)).thenReturn(Optional.of(earlier));
        when(extraOpsRepository.existsByStatus(ExtraOpsStatus.ACTIVE)).thenReturn(false);
        when(scheduler.checkExists(any(JobKey.class))).thenReturn(true);

        // WHEN
        service.updateExtraOpsForSubscription(subscription, 10);

        // THEN
        assertThat(earlier.getCurrentOpsUsage()).isEqualTo(10);
        assertThat(earlier.getStatus()).isEqualTo(ExtraOpsStatus.ACTIVE);
        assertThat(later.getCurrentOpsUsage()).isZero();
        verify(extraOpsRepository).findAndLockById(2L);
        verify(extraOpsRepository, never()).findAndLockById(1L);
        verify(extraOpsRepository).save(earlier);
    }

    @Test
    void updateExtraOpsForSubscriptionThrowsWhenCurrentUsageHmacIsInvalid() {
        // GIVEN
        Subscription subscription = newSubscription();
        ExtraOps extraOps = pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 10);
        extraOps.setCurrentOpsUsageHmac("invalid-hmac");
        when(extraOpsRepository.findAndLockById(1L)).thenReturn(Optional.of(extraOps));

        // WHEN-THEN
        assertThatThrownBy(() -> service.updateExtraOpsForSubscription(subscription, 5))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("HMAC validation failed for ExtraOps id: 1");
        verify(extraOpsRepository, never()).save(any());
        verifyNoInteractions(scheduler);
    }

    @Test
    void updateExtraOpsForSubscriptionThrowsWhenSelectedPackCannotBeLocked() {
        // GIVEN
        Subscription subscription = newSubscription();
        pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 10);
        when(extraOpsRepository.findAndLockById(1L)).thenReturn(Optional.empty());

        // WHEN-THEN
        assertThatThrownBy(() -> service.updateExtraOpsForSubscription(subscription, 5))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Extra ops not found during usage update: 1");
        verify(extraOpsRepository, never()).save(any());
        verifyNoInteractions(scheduler);
    }

    @Test
    void updateExtraOpsForSubscriptionDoesNothingWhenUsageIsZero() {
        // GIVEN
        Subscription subscription = newSubscription();
        pack(1L, subscription, ExtraOpsStatus.ACTIVE, 100, 10);

        // WHEN
        service.updateExtraOpsForSubscription(subscription, 0);

        // THEN
        verifyNoInteractions(extraOpsRepository, scheduler);
    }
}

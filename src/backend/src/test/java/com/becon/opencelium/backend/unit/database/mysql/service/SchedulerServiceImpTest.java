/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.database.mysql.repository.SchedulerRepository;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ExecutionArgumentService;
import com.becon.opencelium.backend.database.mysql.service.ExecutionService;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableUsageService;
import com.becon.opencelium.backend.database.mysql.service.MessageService;
import com.becon.opencelium.backend.database.mysql.service.RecipientService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Violation;
import com.becon.opencelium.backend.execution.globalvariable.WorkflowRunGate;
import com.becon.opencelium.backend.quartz.SchedulingStrategy;
import com.becon.opencelium.backend.resource.schedule.RunningJob;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.testutil.fixture.RunningJobFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the test-connection helpers on {@link SchedulerServiceImp}:
 * {@code getRunningConnectionIds}, {@code filterByTestFlag} and {@code filterEntitiesByTestFlag},
 * and for what it does about the global variable references of notifications: a save checks
 * them and records them as usages, a delete removes the usages, and a schedule pointed at another
 * workflow has its stored notifications checked against that workflow.
 *
 * Run with: ./gradlew test --tests "*.SchedulerServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
class SchedulerServiceImpTest {

    @Mock
    private SchedulingStrategy schedulingStrategy;

    @Mock
    private ConnectionService connectionService;

    @Mock
    private MessageService messageService;

    @Mock
    private RecipientService recipientService;

    @Mock
    private SchedulerRepository schedulerRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ExecutionService executionService;

    @Mock
    private ExecutionArgumentService executionArgumentService;

    @Mock
    private GlobalVariableUsageService globalVariableUsageService;

    @Mock
    private WorkflowRunGate runGate;

    private SchedulerService schedulerService;

    @BeforeEach
    void setUp() {
        // The constructor derives schedulingStrategy from a SchedulerFactoryBean, so it cannot be
        // injected directly — construct with the dependencies under test and swap in the mock strategy.
        SchedulerFactoryBean schedulerFactoryBean = mock(SchedulerFactoryBean.class);
        schedulerService = new SchedulerServiceImp(
                connectionService, null, null, messageService, recipientService, null, schedulerRepository,
                notificationRepository, schedulerFactoryBean, executionService, executionArgumentService, null,
                globalVariableUsageService, runGate);
        ReflectionTestUtils.setField(schedulerService, "schedulingStrategy", schedulingStrategy);
    }

    // ── getRunningConnectionIds ───────────────────────────────────────────────

    @Test
    void getRunningConnectionIdsReturnsConnectionIdsFromStrategy() {
        // GIVEN
        var runningJobs = List.of(
                RunningJobFixture.aRunningJob(1L, 2, 1L),
                RunningJobFixture.aRunningJob(2L, 3, 2L)
        );

        when(schedulingStrategy.getRunningJobs()).thenReturn(runningJobs);

        // WHEN
        Set<Long> result = schedulerService.getRunningConnectionIds();

        // THEN
        assertThat(result).containsExactlyInAnyOrder(1L, 2L);
    }

    @Test
    void getRunningConnectionIdsReturnsUnmodifiableSet() {
        // GIVEN
        var runningJobs = new ArrayList<RunningJob>();

        runningJobs.add(RunningJobFixture.aRunningJob(1L, 2, 1L));
        runningJobs.add(RunningJobFixture.aRunningJob(2L, 3, 2L));

        when(schedulingStrategy.getRunningJobs()).thenReturn(runningJobs);

        // WHEN-THEN
        Set<Long> result = schedulerService.getRunningConnectionIds();

        assertThatThrownBy(() -> result.add(99L))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    // ── global variable references of notifications ───────────────────────────

    @Test
    void saveNotificationStoresNothingWhenReferenceIsRejected() {
        EventNotification notification = aNotificationSendingTemplate(21);
        GlobalReferenceValidationException rejection = new GlobalReferenceValidationException(List.of(new Violation(
                Code.OUT_OF_SCOPE,
                "The workflow of notification 'Failure mail' is outside the scope of global variable 'supportUrl'",
                "supportUrl", "{{global.supportUrl}}", null, null, "en.body")));
        doThrow(rejection).when(globalVariableUsageService).checkNotification(notification);

        GlobalReferenceValidationException thrown = catchThrowableOfType(
                () -> schedulerService.saveNotification(notification), GlobalReferenceValidationException.class);

        assertThat(thrown).isSameAs(rejection);
        assertThat(thrown.getViolations()).extracting(Violation::code).containsExactly(Code.OUT_OF_SCOPE);
        verifyNoInteractions(notificationRepository, recipientService, messageService);
        verify(globalVariableUsageService, never()).rebuildForNotification(any());
    }

    @Test
    @DisplayName("saveNotification — checked before anything is stored, indexed once everything is")
    void saveNotificationRebuildsUsagesWhenNotificationIsStored() {
        EventNotification notification = aNotificationSendingTemplate(21);

        schedulerService.saveNotification(notification);

        InOrder order = inOrder(globalVariableUsageService, notificationRepository, messageService);
        order.verify(globalVariableUsageService).checkNotification(notification);
        order.verify(notificationRepository).save(notification);
        order.verify(messageService).save(notification.getEventMessage());
        order.verify(globalVariableUsageService).rebuildForNotification(notification);
    }

    @Test
    void deleteNotificationByIdRemovesUsagesWhenNotificationIsDeleted() {
        schedulerService.deleteNotificationById(21);

        verify(notificationRepository).deleteById(21);
        verify(globalVariableUsageService).deleteForNotification(21L);
    }

    @Test
    @DisplayName("deleteById — the notifications of a schedule are deleted with it, and so are their usages")
    void deleteByIdRemovesUsagesOfNotificationsWhenScheduleIsDeleted() {
        Scheduler schedule = GlobalVariableFixture.aScheduleOf(42L, null);
        schedule.setId(5);
        schedule.setEventNotifications(List.of(aNotificationSendingTemplate(21), aNotificationSendingTemplate(22)));
        when(schedulerRepository.findById(5)).thenReturn(Optional.of(schedule));

        schedulerService.deleteById(5);

        verify(schedulerRepository).delete(schedule);
        verify(globalVariableUsageService).deleteForNotification(21L);
        verify(globalVariableUsageService).deleteForNotification(22L);
    }

    // ── a schedule pointed at another workflow ────────────────────────────────

    @Test
    @DisplayName("update — the stored notifications are checked against the workflow the schedule is given")
    void updateChecksStoredNotificationsWhenWorkflowChanges() {
        Scheduler stored = aStoredScheduleOf(42L);
        when(schedulerRepository.findById(5)).thenReturn(Optional.of(stored));
        Scheduler request = aScheduleRequestFor(43L);

        schedulerService.update(request);

        verify(globalVariableUsageService).checkScheduleWorkflowChange(stored, request.getConnection());
    }

    @Test
    void updateChecksNothingWhenWorkflowStaysSame() {
        when(schedulerRepository.findById(5)).thenReturn(Optional.of(aStoredScheduleOf(42L)));

        schedulerService.update(aScheduleRequestFor(42L));

        verify(globalVariableUsageService, never()).checkScheduleWorkflowChange(any(), any());
    }

    @Test
    @DisplayName("update — a refused workflow change neither writes the schedule nor moves its job")
    void updateWritesNothingWhenNotificationReferenceIsRejected() {
        Scheduler stored = aStoredScheduleOf(42L);
        when(schedulerRepository.findById(5)).thenReturn(Optional.of(stored));
        Scheduler request = aScheduleRequestFor(43L);
        GlobalReferenceValidationException rejection = aNotificationRejection();
        doThrow(rejection).when(globalVariableUsageService).checkScheduleWorkflowChange(stored, request.getConnection());

        GlobalReferenceValidationException thrown = catchThrowableOfType(
                () -> schedulerService.update(request), GlobalReferenceValidationException.class);

        assertThat(thrown).isSameAs(rejection);
        verify(schedulerRepository, never()).save(any());
        verifyNoInteractions(schedulingStrategy);
    }

    @Test
    @DisplayName("save — a schedule sent with the id of a stored one brings that one's notifications to its workflow")
    void saveChecksStoredNotificationsWhenIdOfStoredScheduleIsSent() {
        Scheduler stored = aStoredScheduleOf(42L);
        when(schedulerRepository.findById(5)).thenReturn(Optional.of(stored));
        Scheduler request = aScheduleRequestFor(43L);
        when(schedulerRepository.save(request)).thenReturn(request);

        schedulerService.save(request);

        verify(globalVariableUsageService).checkScheduleWorkflowChange(stored, request.getConnection());
    }

    @Test
    @DisplayName("save — a new schedule has no notifications yet, so no stored schedule is read")
    void saveReadsNoScheduleWhenScheduleIsNew() {
        Scheduler request = aScheduleRequestFor(43L);
        request.setId(0);
        when(schedulerRepository.save(request)).thenReturn(request);

        schedulerService.save(request);

        verify(schedulerRepository, never()).findById(any());
        verifyNoInteractions(globalVariableUsageService);
    }

    @Test
    void saveWritesNothingWhenNotificationReferenceIsRejected() {
        Scheduler stored = aStoredScheduleOf(42L);
        when(schedulerRepository.findById(5)).thenReturn(Optional.of(stored));
        Scheduler request = aScheduleRequestFor(43L);
        GlobalReferenceValidationException rejection = aNotificationRejection();
        doThrow(rejection).when(globalVariableUsageService).checkScheduleWorkflowChange(stored, request.getConnection());

        GlobalReferenceValidationException thrown = catchThrowableOfType(
                () -> schedulerService.save(request), GlobalReferenceValidationException.class);

        assertThat(thrown).isSameAs(rejection);
        verify(schedulerRepository, never()).save(any());
        verifyNoInteractions(schedulingStrategy);
    }

    /** Schedule 5, titled "Nightly", as it is stored: it runs the given workflow and has one notification. */
    private static Scheduler aStoredScheduleOf(long workflowId) {
        Scheduler schedule = GlobalVariableFixture.aScheduleOf(workflowId, 3);
        schedule.setId(5);
        schedule.setTitle("Nightly");
        schedule.setEventNotifications(List.of(aNotificationSendingTemplate(21)));
        return schedule;
    }

    /** Schedule 5, titled "Nightly", as a request sends it: it is to run the given workflow. */
    private static Scheduler aScheduleRequestFor(long workflowId) {
        Scheduler schedule = GlobalVariableFixture.aScheduleOf(workflowId, 4);
        schedule.setId(5);
        schedule.setTitle("Nightly");
        return schedule;
    }

    private static GlobalReferenceValidationException aNotificationRejection() {
        return new GlobalReferenceValidationException(List.of(new Violation(Code.OUT_OF_SCOPE,
                "The workflow of notification 'Failure mail' (schedule 'Nightly') is outside the scope of global"
                        + " variable 'supportUrl'",
                "supportUrl", "{{global.supportUrl}}", null, null, "en.body")));
    }

    /** A notification without recipients that sends a template with a global variable reference. */
    private static EventNotification aNotificationSendingTemplate(int id) {
        return GlobalVariableFixture.aNotification(id, "Failure mail",
                GlobalVariableFixture.aTemplate(3, "Failure template",
                        GlobalVariableFixture.aTemplateContent("en", null, "See {{global.supportUrl}}")),
                null);
    }
}

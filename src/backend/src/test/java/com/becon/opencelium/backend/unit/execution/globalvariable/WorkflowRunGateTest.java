package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableChangeRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableWriter;
import com.becon.opencelium.backend.execution.globalvariable.TestRunOrigins;
import com.becon.opencelium.backend.execution.globalvariable.WorkflowRunGate;
import com.becon.opencelium.backend.execution.globalvariable.WorkflowRunGate.Admission;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.ScheduleData;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.Trigger;

/**
 * Unit tests for {@link WorkflowRunGate}: one execution at a time for a workflow that uses a
 * mutable global variable, the queue and its limits, the Refuse policy, and the webhook starts
 * refused on the call, which are reported once when the run that held the workflow ends.
 *
 * <p>Run with: ./gradlew test --tests "*.WorkflowRunGateTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WorkflowRunGate — unit")
class WorkflowRunGateTest {

    private static final long WORKFLOW = 42L;
    private static final long OTHER_WORKFLOW = 43L;
    private static final JobKey JOB_A = new JobKey("schedule-1", "connection");
    private static final JobKey JOB_B = new JobKey("schedule-2", "connection");
    private static final JobKey JOB_C = new JobKey("schedule-3", "connection");
    private static final int MAX_WAITING = 2;
    private static final Duration MAX_WAIT = Duration.ofMinutes(60);
    private static final int RACERS = 8;

    @Mock
    GlobalVariableRepository repository;

    @Mock
    Scheduler quartzScheduler;

    @Mock
    WebSocketNotificationService notifications;

    private final MutableClock clock = new MutableClock(Instant.parse("2026-11-20T10:00:00Z"));

    private WorkflowRunGate gate;

    @BeforeEach
    void setUp() {
        gate = new WorkflowRunGate(repository, quartzScheduler, notifications, MAX_WAITING, MAX_WAIT, clock);
    }

    // ── admit ────────────────────────────────────────────────────────────────

    @Test
    void admitReturnsUngatedWhenWorkflowUsesNoMutableVariable() {
        when(repository.findMutableUsedByWorkflow(WORKFLOW)).thenReturn(List.of());

        Admission first = gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        Admission second = gate.admit(WORKFLOW, JOB_B, new JobDataMap());

        assertThat(first).isEqualTo(Admission.UNGATED);
        assertThat(second).isEqualTo(Admission.UNGATED);
    }

    @Test
    void admitHoldsWorkflowWhenItIsFree() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);

        Admission admission = gate.admit(WORKFLOW, JOB_A, new JobDataMap());

        assertThat(admission).isEqualTo(Admission.HOLDS);
        assertThat(admission.runs()).isTrue();
    }

    @Test
    void admitQueuesSecondStartWhenPolicyIsQueue() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());

        Admission second = gate.admit(WORKFLOW, JOB_B, new JobDataMap());

        assertThat(second).isEqualTo(Admission.QUEUED);
        assertThat(second.runs()).isFalse();
        assertThat(gate.waitingCount(WORKFLOW)).isEqualTo(1);
        verify(notifications, never()).send(anyLong(), any());
    }

    @Test
    void admitRefusesSecondStartWhenOneVariableSaysRefuse() {
        GlobalVariable queued = GlobalVariableFixture.aMutable(1L, "counter", "0", "0", WORKFLOW);
        GlobalVariable refusing = GlobalVariableFixture.aMutable(2L, "cursor", "0", "0", WORKFLOW);
        refusing.setBusyPolicy(GlobalVariableBusyPolicy.REFUSE);
        when(repository.findMutableUsedByWorkflow(WORKFLOW)).thenReturn(List.of(queued, refusing));
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);

        Admission second = gate.admit(WORKFLOW, JOB_B, new JobDataMap());

        assertThat(second).isEqualTo(Admission.REFUSED);
        assertThat(gate.waitingCount(WORKFLOW)).isZero();
        verify(notifications).send(eq(WORKFLOW), any());
    }

    @Test
    void admitRefusesStartWhenQueueIsFull() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());

        Admission overLimit = gate.admit(WORKFLOW, JOB_C, new JobDataMap());

        assertThat(overLimit).isEqualTo(Admission.REFUSED);
        assertThat(gate.waitingCount(WORKFLOW)).isEqualTo(MAX_WAITING);
    }

    @Test
    void holdOfReturnsExecutionAndStartWhenRunHoldsWorkflow() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);

        assertThat(gate.holdOf(WORKFLOW))
                .contains(new WorkflowRunGate.Hold(WORKFLOW, 900L, Instant.parse("2026-11-20T10:00:00Z")));
        assertThat(gate.holdOf(OTHER_WORKFLOW)).isEmpty();
    }

    @Test
    void admitLetsDifferentWorkflowsRunAtTheSameTime() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        usesMutable(OTHER_WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());

        Admission other = gate.admit(OTHER_WORKFLOW, JOB_B, new JobDataMap());

        assertThat(other).isEqualTo(Admission.HOLDS);
    }

    // ── release ──────────────────────────────────────────────────────────────

    @Test
    void releaseFiresOldestWaitingStartWithTicketAndItsData() throws SchedulerException {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        JobDataMap secondData = new JobDataMap();
        secondData.put("data", "webhook-vars");
        gate.admit(WORKFLOW, JOB_B, secondData);
        gate.admit(WORKFLOW, JOB_C, new JobDataMap());

        gate.release(WORKFLOW);

        Trigger fired = firedTrigger();
        assertThat(fired.getJobKey()).isEqualTo(JOB_B);
        assertThat(fired.getJobDataMap().getString("data")).isEqualTo("webhook-vars");
        assertThat(fired.getJobDataMap().getString(WorkflowRunGate.TICKET_KEY)).isNotBlank();
        assertThat(gate.waitingCount(WORKFLOW)).isEqualTo(1);
    }

    @Test
    void admitHoldsFiredStartAndQueuesNewcomerWhileReserved() throws SchedulerException {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());
        gate.release(WORKFLOW);
        JobDataMap ticketed = firedTrigger().getJobDataMap();

        Admission newcomer = gate.admit(WORKFLOW, JOB_C, new JobDataMap());
        Admission fromQueue = gate.admit(WORKFLOW, JOB_B, ticketed);

        assertThat(newcomer).isEqualTo(Admission.QUEUED);
        assertThat(fromQueue).isEqualTo(Admission.HOLDS);
    }

    @Test
    void releaseFreesWorkflowWhenNothingWaits() throws SchedulerException {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);

        gate.release(WORKFLOW);

        assertThat(gate.holdOf(WORKFLOW)).isEmpty();
        assertThat(gate.admit(WORKFLOW, JOB_B, new JobDataMap())).isEqualTo(Admission.HOLDS);
        verify(quartzScheduler, never()).scheduleJob(any(Trigger.class));
    }

    @Test
    void releaseDropsStartsThatWaitedTooLong() throws SchedulerException {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());
        clock.advance(MAX_WAIT.plusMinutes(1));
        gate.admit(WORKFLOW, JOB_C, new JobDataMap());

        gate.release(WORKFLOW);

        assertThat(firedTrigger().getJobKey()).isEqualTo(JOB_C);
        verify(notifications).send(eq(WORKFLOW), any());
    }

    @Test
    void releaseSkipsWaitingStartThatCannotBeFired() throws SchedulerException {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());
        gate.admit(WORKFLOW, JOB_C, new JobDataMap());
        doThrow(new SchedulerException("job is gone"))
                .doReturn(null)
                .when(quartzScheduler).scheduleJob(any(Trigger.class));

        gate.release(WORKFLOW);

        ArgumentCaptor<Trigger> fired = ArgumentCaptor.forClass(Trigger.class);
        verify(quartzScheduler, times(2)).scheduleJob(fired.capture());
        assertThat(fired.getAllValues().get(1).getJobKey()).isEqualTo(JOB_C);
        assertThat(gate.waitingCount(WORKFLOW)).isZero();
    }

    @Test
    void admitDropsStaleReservationAndMovesQueueOn() throws SchedulerException {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());
        gate.admit(WORKFLOW, JOB_C, new JobDataMap());
        gate.release(WORKFLOW);
        clock.advance(Duration.ofMinutes(11));

        Admission newcomer = gate.admit(WORKFLOW, JOB_A, new JobDataMap());

        assertThat(newcomer).isEqualTo(Admission.QUEUED);
        ArgumentCaptor<Trigger> fired = ArgumentCaptor.forClass(Trigger.class);
        verify(quartzScheduler, times(2)).scheduleJob(fired.capture());
        assertThat(fired.getAllValues().get(1).getJobKey()).isEqualTo(JOB_C);
    }

    // ── refusal listener ─────────────────────────────────────────────────────

    @Test
    @DisplayName("admit — a refused start is handed on with the schedule of the trigger that fired")
    void admitHandsRefusalToListenerWithTriggerScheduleWhenStartIsRefused() {
        List<Refused> refused = listenToRefusals();
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);
        JobDataMap webhookStart = new JobDataMap();
        webhookStart.put("data", new ScheduleData(7, TriggerType.WEBHOOK));

        gate.admit(WORKFLOW, JOB_B, webhookStart);

        assertThat(refused).singleElement().satisfies(start -> {
            assertThat(start.schedule().getScheduleId()).isEqualTo(7);
            assertThat(start.schedule().getExecType()).isEqualTo(TriggerType.WEBHOOK);
            assertThat(start.connectionId()).isEqualTo(WORKFLOW);
            assertThat(start.refusal().getCode()).isEqualTo(GlobalVariableConflictException.Code.BUSY);
            assertThat(start.refusal().getMessage()).contains("'counter'").contains("execution 900");
        });
    }

    @Test
    @DisplayName("admit — without schedule data on the trigger, the schedule is read from the job")
    void admitHandsRefusalToListenerWithJobScheduleWhenTriggerCarriesNone() throws SchedulerException {
        List<Refused> refused = listenToRefusals();
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);
        givenJobOfSchedule(JOB_B, 8);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());

        gate.admit(WORKFLOW, JOB_B, new JobDataMap());

        assertThat(refused).extracting(start -> start.schedule().getScheduleId(), start -> start.schedule().getExecType())
                .containsExactly(tuple(8, TriggerType.SCHEDULER));
    }

    @Test
    @DisplayName("release — a start dropped after waiting too long is handed on like a refused one")
    void releaseHandsDroppedStartToListenerWhenItWaitedTooLong() throws SchedulerException {
        List<Refused> refused = listenToRefusals();
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        givenJobOfSchedule(JOB_B, 8);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());
        clock.advance(MAX_WAIT.plusMinutes(1));

        gate.release(WORKFLOW);

        assertThat(refused).singleElement().satisfies(start -> {
            assertThat(start.schedule().getScheduleId()).isEqualTo(8);
            assertThat(start.refusal().getMessage()).contains("waited longer than 60 minutes");
        });
    }

    @Test
    @DisplayName("admit — a start whose job is gone is still refused and reported, only not recorded")
    void admitSkipsListenerWhenRefusedStartNamesNoSchedule() {
        List<Refused> refused = listenToRefusals();
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());

        Admission second = gate.admit(WORKFLOW, JOB_B, new JobDataMap());

        assertThat(second).isEqualTo(Admission.REFUSED);
        assertThat(refused).isEmpty();
        verify(notifications).send(eq(WORKFLOW), any());
    }

    @Test
    @DisplayName("admit — a listener that fails does not change the decision")
    void admitRefusesStartWhenListenerThrows() {
        gate.onRefusal((schedule, connectionId, refusal) -> {
            throw new IllegalStateException("database is down");
        });
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        JobDataMap start = new JobDataMap();
        start.put("data", new ScheduleData(7, TriggerType.SCHEDULER));

        Admission second = gate.admit(WORKFLOW, JOB_B, start);

        assertThat(second).isEqualTo(Admission.REFUSED);
    }

    // ── checkCanStart ────────────────────────────────────────────────────────

    @Test
    void checkCanStartThrowsBusyWhenRunningWorkflowRefuses() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);

        assertThatThrownBy(() -> gate.checkCanStart(WORKFLOW))
                .isInstanceOfSatisfying(GlobalVariableConflictException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(GlobalVariableConflictException.Code.BUSY);
                    assertThat(e.getMessage()).contains("'counter'").contains("execution 900");
                });
    }

    @Test
    void checkCanStartPassesWhenStartWouldOnlyWait() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());

        assertThatCode(() -> gate.checkCanStart(WORKFLOW)).doesNotThrowAnyException();
    }

    @Test
    void checkCanStartPassesWhenWorkflowIsFree() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);

        assertThatCode(() -> gate.checkCanStart(WORKFLOW)).doesNotThrowAnyException();
    }

    // ── checkWebhookCanStart ─────────────────────────────────────────────────

    @Test
    void checkWebhookCanStartThrowsBusyWhenRunningWorkflowRefuses() {
        givenRunHoldsRefusingWorkflow();

        assertThatThrownBy(() -> gate.checkWebhookCanStart(WORKFLOW, 7))
                .isInstanceOfSatisfying(GlobalVariableConflictException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(GlobalVariableConflictException.Code.BUSY);
                    assertThat(e.getMessage()).contains("'counter'").contains("execution 900");
                });
    }

    @Test
    @DisplayName("checkWebhookCanStart — a start that would only wait is let through and not counted")
    void checkWebhookCanStartPassesWhenStartWouldOnlyWait() {
        List<Refused> refused = listenToRefusals();
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());

        gate.checkWebhookCanStart(WORKFLOW, 7);
        gate.release(WORKFLOW);

        assertThat(refused).isEmpty();
        verify(notifications, never()).send(anyLong(), any());
    }

    @Test
    @DisplayName("checkWebhookCanStart — with a full queue, a start cannot wait either")
    void checkWebhookCanStartThrowsBusyWhenQueueIsFull() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());
        gate.admit(WORKFLOW, JOB_C, new JobDataMap());

        assertThatThrownBy(() -> gate.checkWebhookCanStart(WORKFLOW, 7))
                .isInstanceOfSatisfying(GlobalVariableConflictException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(GlobalVariableConflictException.Code.BUSY);
                    assertThat(e.getMessage()).contains(MAX_WAITING + " starts already wait");
                });
    }

    // ── webhook starts refused on the call ───────────────────────────────────

    @Test
    @DisplayName("release — the webhook starts refused while the run went are handed on as one refusal")
    void releaseReportsRefusedWebhooksOnceWhenRunEnds() {
        List<Refused> refused = listenToRefusals();
        givenRunHoldsRefusingWorkflow();
        refuseWebhookStarts(7, 3);

        gate.release(WORKFLOW);

        assertThat(refused).singleElement().satisfies(start -> {
            assertThat(start.schedule().getScheduleId()).isEqualTo(7);
            assertThat(start.schedule().getExecType()).isEqualTo(TriggerType.WEBHOOK);
            assertThat(start.connectionId()).isEqualTo(WORKFLOW);
            assertThat(start.refusal().getCode()).isEqualTo(GlobalVariableConflictException.Code.BUSY);
            assertThat(start.refusal().getMessage())
                    .contains("schedule 7")
                    .contains("execution 900 of the workflow ran: 3.")
                    .contains("'counter'");
        });
        verify(notifications).send(eq(WORKFLOW), any());
    }

    @Test
    void releaseReportsEachScheduleWhenTwoSchedulesWereRefused() {
        List<Refused> refused = listenToRefusals();
        givenRunHoldsRefusingWorkflow();
        refuseWebhookStarts(7, 2);
        refuseWebhookStarts(8, 1);

        gate.release(WORKFLOW);

        assertThat(refused).extracting(start -> start.schedule().getScheduleId()).containsExactly(7, 8);
        assertThat(refused.get(0).refusal().getMessage()).contains("schedule 7").contains("ran: 2.");
        assertThat(refused.get(1).refusal().getMessage()).contains("schedule 8").contains("ran: 1.");
    }

    @Test
    @DisplayName("release — a refused manual start is not counted: the user saw the answer")
    void releaseReportsNothingWhenOnlyManualStartsWereRefused() {
        List<Refused> refused = listenToRefusals();
        givenRunHoldsRefusingWorkflow();
        assertThatThrownBy(() -> gate.checkCanStart(WORKFLOW)).isInstanceOf(GlobalVariableConflictException.class);

        gate.release(WORKFLOW);

        assertThat(refused).isEmpty();
        verify(notifications, never()).send(anyLong(), any());
    }

    @Test
    @DisplayName("release — what one run's end reported is not reported again when the next run ends")
    void releaseReportsNothingWhenRefusalsWereAlreadyReported() {
        List<Refused> refused = listenToRefusals();
        givenRunHoldsRefusingWorkflow();
        refuseWebhookStarts(7, 2);
        gate.release(WORKFLOW);
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());

        gate.release(WORKFLOW);

        assertThat(refused).hasSize(1);
    }

    @Test
    @DisplayName("release — a listener that fails on the webhook report does not keep the workflow busy")
    void releaseFreesWorkflowWhenListenerThrows() {
        gate.onRefusal((schedule, connectionId, refusal) -> {
            throw new IllegalStateException("database is down");
        });
        givenRunHoldsRefusingWorkflow();
        refuseWebhookStarts(7, 1);

        gate.release(WORKFLOW);

        assertThat(gate.holdOf(WORKFLOW)).isEmpty();
        assertThat(gate.admit(WORKFLOW, JOB_B, new JobDataMap())).isEqualTo(Admission.HOLDS);
    }

    // ── queue order ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("release — the queued starts run one after the other, in the order they came in")
    void releaseRunsQueuedStartsInArrivalOrderWhenEachRunEnds() throws SchedulerException {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        JobKey jobD = new JobKey("schedule-4", "connection");
        WorkflowRunGate roomyGate = aGateWithRoomFor(5);
        roomyGate.admit(WORKFLOW, JOB_A, new JobDataMap());
        for (JobKey job : List.of(JOB_B, JOB_C, jobD)) {
            roomyGate.admit(WORKFLOW, job, new JobDataMap());
        }

        List<JobKey> ranInOrder = new ArrayList<>();
        ArgumentCaptor<Trigger> fired = ArgumentCaptor.forClass(Trigger.class);
        for (int ended = 1; ended <= 3; ended++) {
            roomyGate.release(WORKFLOW);
            verify(quartzScheduler, times(ended)).scheduleJob(fired.capture());
            Trigger next = fired.getValue();
            assertThat(roomyGate.admit(WORKFLOW, next.getJobKey(), next.getJobDataMap()))
                    .isEqualTo(Admission.HOLDS);
            ranInOrder.add(next.getJobKey());
        }
        roomyGate.release(WORKFLOW);

        assertThat(ranInOrder).containsExactly(JOB_B, JOB_C, jobD);
        assertThat(roomyGate.holdOf(WORKFLOW)).isEmpty();
        assertThat(roomyGate.waitingCount(WORKFLOW)).isZero();
        verify(quartzScheduler, times(3)).scheduleJob(any(Trigger.class));
    }

    // ── release after a crash ────────────────────────────────────────────────

    @Test
    @DisplayName("restart — a workflow held by a run that died with the server is free again on startup")
    void admitHoldsWorkflowWhenGateRestartsAfterCrashOfHoldingRun() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());

        // the server crashes: run 900 never releases the workflow, and startup builds a new gate
        WorkflowRunGate restarted = aGateWithRoomFor(MAX_WAITING);

        assertThat(restarted.holdOf(WORKFLOW)).isEmpty();
        assertThat(restarted.waitingCount(WORKFLOW)).isZero();
        assertThat(restarted.admit(WORKFLOW, JOB_C, new JobDataMap())).isEqualTo(Admission.HOLDS);
    }

    @Test
    @DisplayName("restart — a Refuse workflow that was held when the server crashed accepts a manual start again")
    void checkCanStartPassesWhenGateRestartsAfterCrashOfHoldingRun() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);
        assertThatThrownBy(() -> gate.checkCanStart(WORKFLOW)).isInstanceOf(GlobalVariableConflictException.class);

        WorkflowRunGate restarted = aGateWithRoomFor(MAX_WAITING);

        assertThatCode(() -> restarted.checkCanStart(WORKFLOW)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("restart — a start fired from the old queue holds no reservation and waits behind the new run")
    void admitQueuesStartWithTicketFromBeforeRestartWhenWorkflowIsBusy() throws SchedulerException {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.admit(WORKFLOW, JOB_B, new JobDataMap());
        gate.release(WORKFLOW);
        JobDataMap ticketedBeforeCrash = firedTrigger().getJobDataMap();
        String oldTicket = ticketedBeforeCrash.getString(WorkflowRunGate.TICKET_KEY);
        WorkflowRunGate restarted = aGateWithRoomFor(MAX_WAITING);
        restarted.admit(WORKFLOW, JOB_C, new JobDataMap());

        Admission late = restarted.admit(WORKFLOW, JOB_B, ticketedBeforeCrash);
        restarted.release(WORKFLOW);

        assertThat(late).isEqualTo(Admission.QUEUED);
        ArgumentCaptor<Trigger> fired = ArgumentCaptor.forClass(Trigger.class);
        verify(quartzScheduler, times(2)).scheduleJob(fired.capture());
        Trigger refired = fired.getValue();
        assertThat(refired.getJobKey()).isEqualTo(JOB_B);
        assertThat(refired.getJobDataMap().getString(WorkflowRunGate.TICKET_KEY)).isNotBlank().isNotEqualTo(oldTicket);
    }

    // ── concurrent starts and writes ─────────────────────────────────────────

    @Test
    @DisplayName("admit — of starts that race for a free workflow, exactly one holds it and the others wait")
    void admitLetsExactlyOneStartHoldWhenStartsRaceForFreeWorkflow() throws Exception {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.QUEUE);
        WorkflowRunGate roomyGate = aGateWithRoomFor(RACERS);
        CyclicBarrier together = new CyclicBarrier(RACERS);
        ExecutorService pool = Executors.newFixedThreadPool(RACERS);
        try {
            List<Future<Admission>> pending = new ArrayList<>();
            for (int i = 0; i < RACERS; i++) {
                JobKey job = new JobKey("racer-" + i, "connection");
                pending.add(pool.submit(() -> {
                    together.await(5, TimeUnit.SECONDS);
                    return roomyGate.admit(WORKFLOW, job, new JobDataMap());
                }));
            }
            List<Admission> admissions = new ArrayList<>();
            for (Future<Admission> admission : pending) {
                admissions.add(admission.get(5, TimeUnit.SECONDS));
            }

            assertThat(admissions).filteredOn(admission -> admission == Admission.HOLDS).hasSize(1);
            assertThat(admissions).filteredOn(admission -> admission == Admission.QUEUED).hasSize(RACERS - 1);
            assertThat(roomyGate.waitingCount(WORKFLOW)).isEqualTo(RACERS - 1);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    @DisplayName("admit — racing runs of the owner workflow each read and raise a counter, and no write is lost")
    void admitSerializesOwnerRunsSoNoWriteIsLostWhenStartsRace() throws Exception {
        GlobalVariable counter = GlobalVariableFixture.aMutable(1L, "counter", "0", "0", WORKFLOW);
        when(repository.findMutableUsedByWorkflow(WORKFLOW)).thenReturn(List.of(counter));
        AtomicReference<String> stored = new AtomicReference<>("0");
        when(repository.findByNameIn(List.of("counter"))).thenAnswer(invocation ->
                List.of(GlobalVariableFixture.aMutable(1L, "counter", "0", stored.get(), WORKFLOW)));
        when(repository.writeCurrentValue(eq(1L), anyString(), any(Date.class), anyLong())).thenAnswer(invocation -> {
            stored.set(invocation.getArgument(1));
            return 1;
        });
        OwnerRuns runs = new OwnerRuns(aGateWithRoomFor(RACERS),
                new GlobalVariableWriter(repository, mock(GlobalVariableChangeRepository.class),
                        new TestRunOrigins(), 1024));
        // a start fired from the queue comes back through Quartz, which here runs it on the pool
        doAnswer(invocation -> {
            Trigger trigger = invocation.getArgument(0);
            runs.submit(trigger.getJobKey(), trigger.getJobDataMap());
            return new Date();
        }).when(quartzScheduler).scheduleJob(any(Trigger.class));

        try {
            CyclicBarrier together = new CyclicBarrier(RACERS);
            for (int i = 0; i < RACERS; i++) {
                JobKey job = new JobKey("racer-" + i, "connection");
                runs.pool.submit(() -> {
                    together.await(5, TimeUnit.SECONDS);
                    runs.start(job, new JobDataMap());
                    return null;
                });
            }

            await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                    assertThat(runs.finished.get() + runs.failures.size()).isEqualTo(RACERS));
            assertThat(runs.failures).isEmpty();
            assertThat(stored.get()).isEqualTo(String.valueOf(RACERS));
            assertThat(runs.mostAtOnce.get()).isEqualTo(1);
            assertThat(runs.gate.holdOf(WORKFLOW)).isEmpty();
            assertThat(runs.gate.waitingCount(WORKFLOW)).isZero();
        } finally {
            runs.pool.shutdownNow();
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private WorkflowRunGate aGateWithRoomFor(int maxWaiting) {
        return new WorkflowRunGate(repository, quartzScheduler, notifications, maxWaiting, MAX_WAIT, clock);
    }

    /**
     * Runs of the owner workflow of {@code counter} that go through the gate the way {@code
     * ExecutionAspect} lets them: a run that holds the workflow reads the counter, raises it by
     * one with a separate write and releases the workflow when it ends.
     */
    private static final class OwnerRuns {
        private final WorkflowRunGate gate;
        private final GlobalVariableWriter writer;
        private final ExecutorService pool = Executors.newCachedThreadPool();
        private final AtomicLong executionIds = new AtomicLong(900L);
        private final AtomicInteger running = new AtomicInteger();
        private final AtomicInteger mostAtOnce = new AtomicInteger();
        private final AtomicInteger finished = new AtomicInteger();
        private final Queue<Throwable> failures = new ConcurrentLinkedQueue<>();

        OwnerRuns(WorkflowRunGate gate, GlobalVariableWriter writer) {
            this.gate = gate;
            this.writer = writer;
        }

        void submit(JobKey job, JobDataMap triggerData) {
            pool.submit(() -> start(job, triggerData));
        }

        void start(JobKey job, JobDataMap triggerData) {
            try {
                if (gate.admit(WORKFLOW, job, triggerData) != Admission.HOLDS) {
                    return;
                }
                try {
                    mostAtOnce.accumulateAndGet(running.incrementAndGet(), Math::max);
                    GlobalVariableWriter.Run run = writer.forRun(WORKFLOW, executionIds.incrementAndGet());
                    int read = run.readCurrent("counter").orElseThrow().asInt();
                    // gives a racing run the chance to read the same value, which would lose a write
                    Thread.yield();
                    run.write("counter", read + 1);
                    running.decrementAndGet();
                } finally {
                    gate.release(WORKFLOW);
                }
                finished.incrementAndGet();
            } catch (Throwable e) {
                failures.add(e);
            }
        }
    }

    private void usesMutable(long workflowId, GlobalVariableBusyPolicy policy) {
        GlobalVariable variable = GlobalVariableFixture.aMutable(1L, "counter", "0", "0", workflowId);
        variable.setBusyPolicy(policy);
        when(repository.findMutableUsedByWorkflow(workflowId)).thenReturn(List.of(variable));
    }

    /** Execution 900 holds the workflow, whose mutable variable refuses a second start. */
    private void givenRunHoldsRefusingWorkflow() {
        usesMutable(WORKFLOW, GlobalVariableBusyPolicy.REFUSE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);
    }

    /** Lets a webhook of a schedule ask the busy workflow for a start, which is refused each time. */
    private void refuseWebhookStarts(int scheduleId, int times) {
        for (int call = 0; call < times; call++) {
            assertThatThrownBy(() -> gate.checkWebhookCanStart(WORKFLOW, scheduleId))
                    .isInstanceOf(GlobalVariableConflictException.class);
        }
    }

    private List<Refused> listenToRefusals() {
        List<Refused> refused = new ArrayList<>();
        gate.onRefusal((schedule, connectionId, refusal) -> refused.add(new Refused(schedule, connectionId, refusal)));
        return refused;
    }

    private void givenJobOfSchedule(JobKey jobKey, int scheduleId) throws SchedulerException {
        JobDataMap jobData = new JobDataMap();
        jobData.put("data", new ScheduleData(scheduleId, TriggerType.SCHEDULER));
        JobDetail job = mock(JobDetail.class);
        when(job.getJobDataMap()).thenReturn(jobData);
        when(quartzScheduler.getJobDetail(jobKey)).thenReturn(job);
    }

    private record Refused(ScheduleData schedule, long connectionId, GlobalVariableConflictException refusal) {
    }

    private Trigger firedTrigger() throws SchedulerException {
        ArgumentCaptor<Trigger> fired = ArgumentCaptor.forClass(Trigger.class);
        verify(quartzScheduler).scheduleJob(fired.capture());
        return fired.getValue();
    }

    /** A clock the test moves forward by hand. */
    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}

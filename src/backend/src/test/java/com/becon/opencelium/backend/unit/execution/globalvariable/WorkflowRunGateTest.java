package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
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
import java.util.List;
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
 * mutable global variable, the queue and its limits, and the Refuse policy.
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

    // ── helpers ──────────────────────────────────────────────────────────────

    private void usesMutable(long workflowId, GlobalVariableBusyPolicy policy) {
        GlobalVariable variable = GlobalVariableFixture.aMutable(1L, "counter", "0", "0", workflowId);
        variable.setBusyPolicy(policy);
        when(repository.findMutableUsedByWorkflow(workflowId)).thenReturn(List.of(variable));
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

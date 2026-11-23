package com.becon.opencelium.backend.unit.aspect;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.application.language.LanguageService;
import com.becon.opencelium.backend.aspect.ExecutionAspect;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.DataAggregatorService;
import com.becon.opencelium.backend.database.mysql.service.ExecutionService;
import com.becon.opencelium.backend.database.mysql.service.LastExecutionService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.exception.ExecutionTerminatedException;
import com.becon.opencelium.backend.execution.globalvariable.WorkflowRunGate;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import com.becon.opencelium.backend.execution.notification.IncomingWebhookService;
import com.becon.opencelium.backend.execution.service.GlobalVariableSnapshotService;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.ScheduleData;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.stream.Stream;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.Trigger;
import org.springframework.core.env.Environment;

/**
 * Unit tests for the advice of {@link ExecutionAspect} that lets a workflow with a mutable global
 * variable run one execution at a time: the workflow is freed however its run ends, and a start
 * that waits or is refused runs no step. The aspect works with a real {@link WorkflowRunGate}
 * whose store and Quartz scheduler are mocked, so each test checks whether the workflow is free,
 * not only that the gate was called.
 *
 * <p>Run with: ./gradlew test --tests "*.ExecutionAspectGateTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExecutionAspect, one execution at a time — unit")
class ExecutionAspectGateTest {

    private static final long WORKFLOW = 42L;
    private static final int SCHEDULE = 7;
    private static final JobKey JOB_A = new JobKey("schedule-7", "connection");
    private static final JobKey JOB_B = new JobKey("schedule-8", "connection");

    @Mock
    SchedulerService schedulerService;

    @Mock
    GlobalVariableRepository repository;

    @Mock
    Scheduler quartzScheduler;

    private WorkflowRunGate gate;

    private ExecutionAspect aspect;

    @BeforeEach
    void setUp() {
        gate = new WorkflowRunGate(repository, quartzScheduler, mock(WebSocketNotificationService.class),
                100, Duration.ofMinutes(60), Clock.systemUTC());
        aspect = new ExecutionAspect(schedulerService, mock(UserService.class), mock(ExecutionService.class),
                mock(LastExecutionService.class), mock(SubscriptionService.class), mock(DataAggregatorService.class),
                mock(LogDataService.class), mock(IncomingWebhookService.class), mock(EmailServiceImpl.class),
                mock(Environment.class), mock(WebSocketNotificationService.class), mock(ConnectionService.class),
                mock(LanguageService.class), mock(GlobalVariableSnapshotService.class), gate);
    }

    // ── release on every end ─────────────────────────────────────────────────

    @Test
    void gateByMutableVariablesFreesWorkflowWhenRunSucceeds() throws Throwable {
        usesMutable(GlobalVariableBusyPolicy.QUEUE);
        ProceedingJoinPoint run = mock(ProceedingJoinPoint.class);
        when(run.proceed()).thenReturn("done");

        Object result = aspect.gateByMutableVariables(run, aStartOf(JOB_A, TriggerType.SCHEDULER));

        assertThat(result).isEqualTo("done");
        assertThat(gate.holdOf(WORKFLOW)).isEmpty();
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("endingsOfFailedRuns")
    @DisplayName("gateByMutableVariables — a run that fails, is terminated or is stopped frees the workflow and rethrows")
    void gateByMutableVariablesFreesWorkflowWhenRunEndsWithThrowable(Throwable ending) throws Throwable {
        usesMutable(GlobalVariableBusyPolicy.QUEUE);
        ProceedingJoinPoint run = mock(ProceedingJoinPoint.class);
        when(run.proceed()).thenThrow(ending);

        assertThatThrownBy(() -> aspect.gateByMutableVariables(run, aStartOf(JOB_A, TriggerType.SCHEDULER)))
                .isSameAs(ending);
        assertThat(gate.holdOf(WORKFLOW)).isEmpty();
    }

    static Stream<Throwable> endingsOfFailedRuns() {
        return Stream.of(
                new IllegalStateException("a step failed"),
                new ExecutionTerminatedException("Execution terminated."),
                new JobExecutionException("the job failed"),
                new StackOverflowError("too deep"));
    }

    @Test
    @DisplayName("gateByMutableVariables — the end of a run fires the start that waited, which then holds the workflow")
    void gateByMutableVariablesFiresWaitingStartWhenRunEnds() throws Throwable {
        usesMutable(GlobalVariableBusyPolicy.QUEUE);
        ProceedingJoinPoint waiting = mock(ProceedingJoinPoint.class);
        ProceedingJoinPoint running = mock(ProceedingJoinPoint.class);
        when(running.proceed()).thenAnswer(invocation ->
                aspect.gateByMutableVariables(waiting, aStartOf(JOB_B, TriggerType.SCHEDULER)));

        aspect.gateByMutableVariables(running, aStartOf(JOB_A, TriggerType.SCHEDULER));

        ArgumentCaptor<Trigger> fired = ArgumentCaptor.forClass(Trigger.class);
        verify(quartzScheduler).scheduleJob(fired.capture());
        assertThat(fired.getValue().getJobKey()).isEqualTo(JOB_B);
        verify(waiting, never()).proceed();

        ProceedingJoinPoint refired = mock(ProceedingJoinPoint.class);
        aspect.gateByMutableVariables(refired, aStartOf(JOB_B, fired.getValue().getJobDataMap()));

        verify(refired).proceed();
        assertThat(gate.holdOf(WORKFLOW)).isEmpty();
    }

    // ── starts that do not run ───────────────────────────────────────────────

    @Test
    @DisplayName("gateByMutableVariables — a start that waits runs no step until it leaves the queue")
    void gateByMutableVariablesRunsNoStepWhenStartIsQueued() throws Throwable {
        usesMutable(GlobalVariableBusyPolicy.QUEUE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        ProceedingJoinPoint queued = mock(ProceedingJoinPoint.class);

        Object result = aspect.gateByMutableVariables(queued, aStartOf(JOB_B, TriggerType.SCHEDULER));

        assertThat(result).isNull();
        verify(queued, never()).proceed();
        assertThat(gate.waitingCount(WORKFLOW)).isEqualTo(1);
        assertThat(gate.holdOf(WORKFLOW)).isPresent();
    }

    @Test
    @DisplayName("gateByMutableVariables — a refused start runs no step and leaves the running one holding the workflow")
    void gateByMutableVariablesRunsNoStepWhenStartIsRefused() throws Throwable {
        usesMutable(GlobalVariableBusyPolicy.REFUSE);
        gate.admit(WORKFLOW, JOB_A, new JobDataMap());
        gate.recordExecution(WORKFLOW, 900L);
        ProceedingJoinPoint refused = mock(ProceedingJoinPoint.class);

        Object result = aspect.gateByMutableVariables(refused, aStartOf(JOB_B, TriggerType.SCHEDULER));

        assertThat(result).isNull();
        verify(refused, never()).proceed();
        assertThat(gate.holdOf(WORKFLOW)).get().extracting(WorkflowRunGate.Hold::executionId).isEqualTo(900L);
        assertThat(gate.waitingCount(WORKFLOW)).isZero();
    }

    // ── starts the gate leaves alone ─────────────────────────────────────────

    @Test
    @DisplayName("gateByMutableVariables — a workflow without a mutable variable runs and is never held")
    void gateByMutableVariablesRunsWithoutHoldingWhenWorkflowUsesNoMutable() throws Throwable {
        givenSchedule();
        when(repository.findMutableUsedByWorkflow(WORKFLOW)).thenReturn(List.of());
        ProceedingJoinPoint run = mock(ProceedingJoinPoint.class);
        when(run.proceed()).thenAnswer(invocation -> gate.holdOf(WORKFLOW).isPresent());

        Object heldWhileRunning = aspect.gateByMutableVariables(run, aStartOf(JOB_A, TriggerType.SCHEDULER));

        assertThat(heldWhileRunning).isEqualTo(false);
    }

    @Test
    @DisplayName("gateByMutableVariables — a test run writes only its own copy, so it never asks the gate")
    void gateByMutableVariablesSkipsGateWhenRunIsTestRun() throws Throwable {
        ProceedingJoinPoint run = mock(ProceedingJoinPoint.class);
        when(run.proceed()).thenReturn("tested");

        Object result = aspect.gateByMutableVariables(run, aStartOf(JOB_A, TriggerType.EXECUTION_TEST));

        assertThat(result).isEqualTo("tested");
        verifyNoInteractions(repository, schedulerService);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void usesMutable(GlobalVariableBusyPolicy policy) {
        givenSchedule();
        GlobalVariable variable = GlobalVariableFixture.aMutable(1L, "counter", "0", "0", WORKFLOW);
        variable.setBusyPolicy(policy);
        when(repository.findMutableUsedByWorkflow(WORKFLOW)).thenReturn(List.of(variable));
    }

    private void givenSchedule() {
        when(schedulerService.getById(SCHEDULE)).thenReturn(GlobalVariableFixture.aScheduleOf(WORKFLOW, null));
    }

    /** A start of schedule {@code SCHEDULE} by its job, as Quartz hands it to the job executor. */
    private static JobExecutionContext aStartOf(JobKey job, TriggerType type) {
        JobDataMap triggerData = new JobDataMap();
        triggerData.put("data", new ScheduleData(SCHEDULE, type));
        return aStartOf(job, triggerData);
    }

    /** A start whose trigger carries {@code triggerData}, e.g. a start fired from the queue. */
    private static JobExecutionContext aStartOf(JobKey job, JobDataMap triggerData) {
        JobExecutionContext context = mock(JobExecutionContext.class);
        when(context.getMergedJobDataMap()).thenReturn(new JobDataMap(triggerData));
        JobDetail detail = mock(JobDetail.class);
        Trigger trigger = mock(Trigger.class);
        // lenient: a test run never reaches the gate, which reads the job and the trigger
        lenient().when(detail.getKey()).thenReturn(job);
        lenient().when(trigger.getJobDataMap()).thenReturn(triggerData);
        lenient().when(context.getJobDetail()).thenReturn(detail);
        lenient().when(context.getTrigger()).thenReturn(trigger);
        return context;
    }
}

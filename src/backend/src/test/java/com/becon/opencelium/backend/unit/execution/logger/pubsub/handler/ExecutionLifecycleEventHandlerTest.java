package com.becon.opencelium.backend.unit.execution.logger.pubsub.handler;

import com.becon.opencelium.backend.constant.props.LogProperties;
import com.becon.opencelium.backend.constant.props.SupportFileProperties;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.LastExecutionService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.execution.logger.pubsub.Execution2MetadataMapping;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionFinishedEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionStartedEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.handler.ExecutionLifecycleEventHandler;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.template.service.TemplateService;
import com.becon.opencelium.backend.websocket.Connection2WebSocketChannelMapping;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import com.becon.opencelium.backend.websocket.constant.SocketConstant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static com.becon.opencelium.backend.constant.LogConstant.FAIL;
import static com.becon.opencelium.backend.constant.LogConstant.SUCCESS;
import static com.becon.opencelium.backend.constant.LogConstant.TERMINATED;
import static com.becon.opencelium.backend.constant.LogConstant.UNCATEGORIZED;
import static com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType.EXECUTION_TEST;
import static com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType.SCHEDULER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ExecutionLifecycleEventHandler}.
 * <p>
 * The handler resolves its log folder ({@code ./logs}) against the {@code user.dir} system
 * property, so every test points {@code user.dir} at a temporary directory and restores it
 * afterwards. No Spring context is loaded.
 * <p>
 * Run with: ./gradlew test --tests "*.ExecutionLifecycleEventHandlerTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExecutionLifecycleEventHandler — unit")
class ExecutionLifecycleEventHandlerTest {
    private static final long EXECUTION_ID = 535L;
    private static final long CONNECTION_ID = 100L;
    private static final int SCHEDULER_ID = 95;
    private static final String TIMESTAMP = "2026-09-29_15-30";

    @Mock
    private SchedulerService schedulerService;

    @Mock
    private ConnectionService connectionService;

    @Mock
    private LastExecutionService lastExecutionService;

    @Mock
    private Execution2MetadataMapping metadata;

    @Mock
    private LogDataService logDataService;

    @Mock
    private TemplateService templateService;

    @Mock
    private ConnectorService connectorService;

    @Mock
    private InvokerService invokerService;

    @Mock
    private WebSocketNotificationService notificationService;

    @TempDir
    Path workingDir;

    private String originalUserDir;
    private ExecutionLifecycleEventHandler handler;

    @BeforeEach
    void setUp() {
        originalUserDir = System.getProperty("user.dir");
        System.setProperty("user.dir", workingDir.toString());
        handler = newHandler(new LogProperties());
    }

    @AfterEach
    void tearDown() {
        System.setProperty("user.dir", originalUserDir);
    }

    // ── has-log flag ─────────────────────────────────────────────────────────

    @Test
    void handleMarksFailLogAvailableWhenFailedExecutionLogIsStored() throws IOException {
        givenStoredLog();

        handler.handle(finishedEvent(SCHEDULER, FAIL));

        assertThat(categorizedLogFile(FAIL)).isRegularFile();
        verify(lastExecutionService).markFailLogAvailable(SCHEDULER_ID, EXECUTION_ID);
        verifyNoMoreInteractions(lastExecutionService);
    }

    @Test
    void handleMarksSuccessLogAvailableWhenSuccessfulExecutionLogIsStored() throws IOException {
        givenStoredLog();

        handler.handle(finishedEvent(SCHEDULER, SUCCESS));

        assertThat(categorizedLogFile(SUCCESS)).isRegularFile();
        verify(lastExecutionService).markSuccessLogAvailable(SCHEDULER_ID, EXECUTION_ID);
        verifyNoMoreInteractions(lastExecutionService);
    }

    @Test
    @DisplayName("handle — a terminated execution is recorded as the scheduler's last failure")
    void handleMarksFailLogAvailableWhenExecutionIsTerminated() throws IOException {
        givenStoredLog();

        handler.handle(finishedEvent(SCHEDULER, TERMINATED));

        assertThat(categorizedLogFile(TERMINATED)).isRegularFile();
        verify(lastExecutionService).markFailLogAvailable(SCHEDULER_ID, EXECUTION_ID);
        verifyNoMoreInteractions(lastExecutionService);
    }

    @Test
    void handleDoesNotMarkLogWhenLogFileIsMissing() {
        givenKnownExecution();

        handler.handle(finishedEvent(SCHEDULER, FAIL));

        verifyNoInteractions(lastExecutionService);
    }

    @Test
    void handleDoesNotMarkLogWhenDbRecordsAreMissing() throws IOException {
        givenKnownExecution();
        writeUncategorizedLog();
        when(logDataService.hasDbRecords(EXECUTION_ID)).thenReturn(false);

        handler.handle(finishedEvent(SCHEDULER, FAIL));

        assertThat(uncategorizedLogFile()).isRegularFile();
        verifyNoInteractions(lastExecutionService);
    }

    @Test
    @DisplayName("handle — a non-empty directory at the destination makes the move fail")
    void handleDoesNotMarkLogWhenMoveFails() throws IOException {
        givenStoredLog();
        Files.createDirectories(categorizedLogFile(FAIL));
        Files.writeString(categorizedLogFile(FAIL).resolve("blocker"), "");

        handler.handle(finishedEvent(SCHEDULER, FAIL));

        assertThat(uncategorizedLogFile()).isRegularFile();
        verifyNoInteractions(lastExecutionService);
    }

    @Test
    @DisplayName("handle — a fail retention limit of 0 deletes the log right after it is moved")
    void handleDoesNotMarkLogWhenRetentionLimitIsZero() throws IOException {
        LogProperties logProperties = new LogProperties();
        logProperties.getRetention().getPerConnection().setFail(0);
        handler = newHandler(logProperties);
        givenStoredLog();

        handler.handle(finishedEvent(SCHEDULER, FAIL));

        assertThat(categorizedLogFile(FAIL)).doesNotExist();
        verifyNoInteractions(lastExecutionService);
    }

    @Test
    @DisplayName("handle — a test execution's scheduler is deleted, so its log is never marked")
    void handleDoesNotMarkLogWhenExecutionIsTest() throws IOException {
        givenStoredLog();

        handler.handle(finishedEvent(EXECUTION_TEST, FAIL));

        assertThat(categorizedLogFile(FAIL)).isRegularFile();
        verifyNoInteractions(lastExecutionService);
    }

    // ── running-jobs broadcast ───────────────────────────────────────────────

    @Test
    void handleBroadcastsRunningJobsWhenExecutionFinishes() {
        givenKnownExecution();
        List<RunningJobsResource> runningJobs = List.of(aRunningJob());
        when(schedulerService.getAllRunningJobsExcludingOne(SCHEDULER_ID)).thenReturn(runningJobs);

        handler.handle(finishedEvent(SCHEDULER, SUCCESS));

        verify(notificationService).send(SocketConstant.SCHEDULER_DESTINATION, runningJobs);
    }

    @Test
    @DisplayName("handle — clients refetch the scheduler on the broadcast, so the flag is set first")
    void handleBroadcastsRunningJobsAfterMarkingLog() throws IOException {
        givenStoredLog();
        List<RunningJobsResource> runningJobs = List.of(aRunningJob());
        when(schedulerService.getAllRunningJobsExcludingOne(SCHEDULER_ID)).thenReturn(runningJobs);

        handler.handle(finishedEvent(SCHEDULER, FAIL));

        InOrder inOrder = inOrder(lastExecutionService, notificationService);
        inOrder.verify(lastExecutionService).markFailLogAvailable(SCHEDULER_ID, EXECUTION_ID);
        inOrder.verify(notificationService).send(SocketConstant.SCHEDULER_DESTINATION, runningJobs);
    }

    @Test
    void handleBroadcastsRunningJobsWhenMarkingLogFails() throws IOException {
        givenStoredLog();
        doThrow(new IllegalStateException("database unavailable"))
                .when(lastExecutionService).markFailLogAvailable(SCHEDULER_ID, EXECUTION_ID);

        assertThatThrownBy(() -> handler.handle(finishedEvent(SCHEDULER, FAIL)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("database unavailable");

        verify(notificationService).send(eq(SocketConstant.SCHEDULER_DESTINATION), any());
    }

    @Test
    @DisplayName("handle — without metadata the broadcast falls back to the event's scheduler id")
    void handleBroadcastsRunningJobsWhenExecutionMetadataIsUnknown() {
        when(metadata.exists(EXECUTION_ID)).thenReturn(false);
        List<RunningJobsResource> runningJobs = List.of(aRunningJob());
        when(schedulerService.getAllRunningJobsExcludingOne(SCHEDULER_ID)).thenReturn(runningJobs);

        handler.handle(finishedEvent(SCHEDULER, FAIL));

        verify(notificationService).send(SocketConstant.SCHEDULER_DESTINATION, runningJobs);
    }

    @Test
    void handleCompletesWhenRunningJobsBroadcastFails() {
        when(metadata.exists(EXECUTION_ID)).thenReturn(false);
        when(schedulerService.getAllRunningJobsExcludingOne(SCHEDULER_ID))
                .thenThrow(new IllegalStateException("scheduler unavailable"));

        assertThatCode(() -> handler.handle(finishedEvent(SCHEDULER, FAIL)))
                .doesNotThrowAnyException();

        verify(metadata).remove(EXECUTION_ID);
    }

    @Test
    void handleDoesNotBroadcastRunningJobsWhenExecutionStarts() {
        handler.handle(new ExecutionStartedEvent(EXECUTION_ID, CONNECTION_ID, SCHEDULER_ID, TIMESTAMP));

        verifyNoInteractions(notificationService);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ExecutionLifecycleEventHandler newHandler(LogProperties logProperties) {
        return new ExecutionLifecycleEventHandler(
                schedulerService,
                connectionService,
                lastExecutionService,
                new Connection2WebSocketChannelMapping(),
                metadata,
                logDataService,
                templateService,
                connectorService,
                invokerService,
                notificationService,
                logProperties,
                new SupportFileProperties()
        );
    }

    private void givenKnownExecution() {
        when(metadata.exists(EXECUTION_ID)).thenReturn(true);
        when(metadata.getConnectionId(EXECUTION_ID)).thenReturn(CONNECTION_ID);
        when(metadata.getSchedulerId(EXECUTION_ID)).thenReturn(SCHEDULER_ID);
        when(metadata.getTimestamp(EXECUTION_ID)).thenReturn(TIMESTAMP);
    }

    private void givenStoredLog() throws IOException {
        givenKnownExecution();
        writeUncategorizedLog();
        when(logDataService.hasDbRecords(EXECUTION_ID)).thenReturn(true);
    }

    private void writeUncategorizedLog() throws IOException {
        Files.createDirectories(uncategorizedLogFile().getParent());
        Files.writeString(uncategorizedLogFile(), "phase=EXECUTION_START id=" + EXECUTION_ID);
    }

    private Path uncategorizedLogFile() {
        return workingDir.resolve("logs").resolve(logFileName(UNCATEGORIZED));
    }

    private Path categorizedLogFile(String result) {
        return workingDir.resolve("logs").resolve(String.valueOf(CONNECTION_ID)).resolve(logFileName(result));
    }

    private static String logFileName(String result) {
        return "%s_%d_%s_%d.log".formatted(TIMESTAMP, CONNECTION_ID, result, EXECUTION_ID);
    }

    private static ExecutionFinishedEvent finishedEvent(TriggerType type, String result) {
        return new ExecutionFinishedEvent(EXECUTION_ID, SCHEDULER_ID, type, result);
    }

    private static RunningJobsResource aRunningJob() {
        RunningJobsResource runningJob = new RunningJobsResource();
        runningJob.setConnectionId(101L);
        runningJob.setSchedulerId(96);
        runningJob.setExecId(600L);
        return runningJob;
    }
}

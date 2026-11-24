package com.becon.opencelium.backend.unit.execution.service;

import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aSnapshotOf;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.anOpenEntry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Violation;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.service.ExecutionObjectServiceImp;
import com.becon.opencelium.backend.execution.service.GlobalVariableSnapshotService;
import com.becon.opencelium.backend.mapper.execution.ConnectionExMapper;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.ScheduleData;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * Unit tests for what {@link ExecutionObjectServiceImp} hands to an execution: the proxy settings
 * and the snapshot of global variables, which every reference of the workflow must be found in.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExecutionObjectServiceImp — unit")
class ExecutionObjectServiceImpTest {

    private static final int SCHEDULE_ID = 7;
    private static final long CONNECTION_ID = 11L;
    private static final String SNAPSHOT_ID = "snapshot-1";

    @Mock
    private Environment environment;

    @Mock
    private ConnectionExMapper connectionMapper;

    @Mock
    private SchedulerService schedulerService;

    @Mock
    private ConnectionMngService connectionMngService;

    @Mock
    private ConnectionService connectionService;

    @Mock
    private GlobalVariableSnapshotService globalVariableSnapshotService;

    @Mock
    private GlobalReferenceValidator globalReferenceValidator;

    @Captor
    private ArgumentCaptor<GlobalVariableSnapshot> snapshotGivenToMapper;

    @Test
    void buildObjPassesProxyUserAsUserAndPasswordAsPasswordWhenProxyCredentialsAreConfigured() {
        givenScheduledConnection();
        when(globalVariableSnapshotService.takeFor(CONNECTION_ID)).thenReturn(GlobalVariableSnapshot.empty());
        when(environment.getProperty(AppYamlPath.PROXY_HOST, "")).thenReturn("proxy.example.test");
        when(environment.getProperty(AppYamlPath.PROXY_PORT, "")).thenReturn("3128");
        when(environment.getProperty(AppYamlPath.PROXY_USER, "")).thenReturn("proxy-user");
        when(environment.getProperty(AppYamlPath.PROXY_PASS, "")).thenReturn("proxy-password");
        ExecutionObjectServiceImp service = new ExecutionObjectServiceImp(
                environment, connectionMapper, schedulerService, connectionMngService, connectionService,
                globalVariableSnapshotService, globalReferenceValidator);

        ProxyEx proxy = service.buildObj(new ScheduleData(SCHEDULE_ID, TriggerType.SCHEDULER)).getProxy();

        assertThat(proxy.getHost()).isEqualTo("proxy.example.test");
        assertThat(proxy.getPort()).isEqualTo("3128");
        assertThat(proxy.getUser()).isEqualTo("proxy-user");
        assertThat(proxy.getPassword()).isEqualTo("proxy-password");
    }

    @Test
    @DisplayName("buildObj — the run gets the snapshot taken for its own workflow")
    void buildObjAttachesSnapshotWhenRunIsBuilt() {
        givenScheduledConnection();
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(
                new GlobalVariableSnapshot.Entry("idoitUrl", 4, new TextNode("https://cmdb.example.test"))));
        when(globalVariableSnapshotService.takeFor(CONNECTION_ID)).thenReturn(snapshot);
        ExecutionObjectServiceImp service = new ExecutionObjectServiceImp(
                environment, connectionMapper, schedulerService, connectionMngService, connectionService,
                globalVariableSnapshotService, globalReferenceValidator);

        ExecutionObj executionObj = service.buildObj(new ScheduleData(SCHEDULE_ID, TriggerType.SCHEDULER));

        assertThat(executionObj.getGlobalSnapshot()).isSameAs(snapshot);
    }

    @Test
    @DisplayName("buildObj — the connectors are read with the one snapshot the run carries; every snapshot taken "
            + "here is a new one, so a second take would not go unnoticed")
    void buildObjReadsConnectorsWithRunSnapshotWhenRunIsBuilt() {
        givenScheduledConnection();
        when(globalVariableSnapshotService.takeFor(CONNECTION_ID)).thenAnswer(invocation ->
                aSnapshotOf(anOpenEntry("idoitUrl", "https://cmdb.example.test")));
        ExecutionObjectServiceImp service = new ExecutionObjectServiceImp(
                environment, connectionMapper, schedulerService, connectionMngService, connectionService,
                globalVariableSnapshotService, globalReferenceValidator);

        ExecutionObj executionObj = service.buildObj(new ScheduleData(SCHEDULE_ID, TriggerType.SCHEDULER));

        verify(connectionMapper).toEntity(any(ConnectionMng.class), snapshotGivenToMapper.capture());
        assertThat(snapshotGivenToMapper.getValue()).isSameAs(executionObj.getGlobalSnapshot());
    }

    @Test
    @DisplayName("buildObj — the references of the workflow are checked against the snapshot the run carries")
    void buildObjChecksReferencesAgainstRunSnapshotWhenRunIsBuilt() {
        ConnectionMng connectionMng = givenScheduledConnection();
        GlobalVariableSnapshot snapshot = aSnapshotOf(anOpenEntry("idoitUrl", "https://cmdb.example.test"));
        when(globalVariableSnapshotService.takeFor(CONNECTION_ID)).thenReturn(snapshot);
        ExecutionObjectServiceImp service = new ExecutionObjectServiceImp(
                environment, connectionMapper, schedulerService, connectionMngService, connectionService,
                globalVariableSnapshotService, globalReferenceValidator);

        service.buildObj(new ScheduleData(SCHEDULE_ID, TriggerType.SCHEDULER));

        verify(globalReferenceValidator).validateRun(connectionMng, snapshot);
    }

    @Test
    @DisplayName("buildObj — a reference the run cannot read stops the run before its connectors are read")
    void buildObjThrowsBeforeReadingConnectorsWhenReferenceCannotBeRead() {
        Scheduler scheduler = aSchedulerOfConnection();
        ConnectionMng connectionMng = new ConnectionMng();
        when(schedulerService.getById(SCHEDULE_ID)).thenReturn(scheduler);
        when(connectionMngService.getById(SNAPSHOT_ID)).thenReturn(connectionMng);
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.empty();
        when(globalVariableSnapshotService.takeFor(CONNECTION_ID)).thenReturn(snapshot);
        GlobalReferenceValidationException rejection = new GlobalReferenceValidationException(List.of(new Violation(
                Code.UNKNOWN_VARIABLE, "Global variable 'idoitUrl' does not exist",
                "idoitUrl", "{{global.idoitUrl}}", "#ababab", "0_1", "endpoint")));
        doThrow(rejection).when(globalReferenceValidator)
                .validateRun(connectionMng, snapshot);
        ExecutionObjectServiceImp service = new ExecutionObjectServiceImp(
                environment, connectionMapper, schedulerService, connectionMngService, connectionService,
                globalVariableSnapshotService, globalReferenceValidator);

        assertThatThrownBy(() -> service.buildObj(new ScheduleData(SCHEDULE_ID, TriggerType.SCHEDULER)))
                .isSameAs(rejection);
        verifyNoInteractions(connectionMapper);
    }

    private ConnectionMng givenScheduledConnection() {
        Scheduler scheduler = aSchedulerOfConnection();
        ConnectionMng connectionMng = new ConnectionMng();

        when(schedulerService.getById(SCHEDULE_ID)).thenReturn(scheduler);
        when(connectionMngService.getById(SNAPSHOT_ID)).thenReturn(connectionMng);
        when(connectionMapper.toEntity(eq(connectionMng), any(GlobalVariableSnapshot.class)))
                .thenReturn(new ConnectionEx());
        when(connectionService.getById(CONNECTION_ID)).thenReturn(scheduler.getConnection());
        return connectionMng;
    }

    private static Scheduler aSchedulerOfConnection() {
        Connection connection = new Connection();
        connection.setId(CONNECTION_ID);
        connection.setSnapshotId(SNAPSHOT_ID);
        connection.setTitle("orders sync");
        Scheduler scheduler = new Scheduler();
        scheduler.setConnection(connection);
        return scheduler;
    }
}

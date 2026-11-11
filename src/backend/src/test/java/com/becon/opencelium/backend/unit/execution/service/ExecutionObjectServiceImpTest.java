package com.becon.opencelium.backend.unit.execution.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.execution.service.ExecutionObjectServiceImp;
import com.becon.opencelium.backend.mapper.execution.ConnectionExMapper;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.ScheduleData;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/** Unit tests for the proxy settings {@link ExecutionObjectServiceImp} hands to an execution. */
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

    @Test
    void buildObjPassesProxyUserAsUserAndPasswordAsPasswordWhenProxyCredentialsAreConfigured() {
        givenScheduledConnection();
        when(environment.getProperty(AppYamlPath.PROXY_HOST, "")).thenReturn("proxy.example.test");
        when(environment.getProperty(AppYamlPath.PROXY_PORT, "")).thenReturn("3128");
        when(environment.getProperty(AppYamlPath.PROXY_USER, "")).thenReturn("proxy-user");
        when(environment.getProperty(AppYamlPath.PROXY_PASS, "")).thenReturn("proxy-password");
        ExecutionObjectServiceImp service = new ExecutionObjectServiceImp(
                environment, connectionMapper, schedulerService, connectionMngService, connectionService);

        ProxyEx proxy = service.buildObj(new ScheduleData(SCHEDULE_ID, TriggerType.SCHEDULER)).getProxy();

        assertThat(proxy.getHost()).isEqualTo("proxy.example.test");
        assertThat(proxy.getPort()).isEqualTo("3128");
        assertThat(proxy.getUser()).isEqualTo("proxy-user");
        assertThat(proxy.getPassword()).isEqualTo("proxy-password");
    }

    private void givenScheduledConnection() {
        Connection connection = new Connection();
        connection.setId(CONNECTION_ID);
        connection.setSnapshotId(SNAPSHOT_ID);
        connection.setTitle("orders sync");
        Scheduler scheduler = new Scheduler();
        scheduler.setConnection(connection);
        ConnectionMng connectionMng = new ConnectionMng();

        when(schedulerService.getById(SCHEDULE_ID)).thenReturn(scheduler);
        when(connectionMngService.getById(SNAPSHOT_ID)).thenReturn(connectionMng);
        when(connectionMapper.toEntity(connectionMng)).thenReturn(new ConnectionEx());
        when(connectionService.getById(CONNECTION_ID)).thenReturn(connection);
    }
}

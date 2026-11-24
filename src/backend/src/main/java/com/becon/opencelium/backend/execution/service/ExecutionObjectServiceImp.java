package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.mapper.execution.ConnectionExMapper;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class ExecutionObjectServiceImp implements ExecutionObjectService {

    private final Environment env;
    private final ConnectionExMapper connectionMapper;
    private final SchedulerService schedulerService;
    private final ConnectionMngService connectionMngService;
    private final ConnectionService connectionService;
    private final GlobalVariableSnapshotService globalVariableSnapshotService;
    private final GlobalReferenceValidator globalReferenceValidator;

    public ExecutionObjectServiceImp(
            Environment environment,
            ConnectionExMapper connectionMapper,
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("connectionMngServiceImp") ConnectionMngService connectionMngService,
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            GlobalVariableSnapshotService globalVariableSnapshotService,
            GlobalReferenceValidator globalReferenceValidator) {
        this.connectionMapper = connectionMapper;
        this.schedulerService = schedulerService;
        this.connectionMngService = connectionMngService;
        this.connectionService = connectionService;
        this.globalVariableSnapshotService = globalVariableSnapshotService;
        this.globalReferenceValidator = globalReferenceValidator;
        this.env = environment;
    }

    @Override
    public ExecutionObj buildObj(QuartzJobScheduler.ScheduleData data) {
        int scheduleId = data.getScheduleId();
        Scheduler scheduler = schedulerService.getById(scheduleId);
        ConnectionMng connectionMng = connectionMngService.getById(scheduler.getConnection().getSnapshotId());

        ExecutionObj executionObj = new ExecutionObj();

        // taken once, before the first step: a variable changed while the run is going reaches
        // the next run, not this one. Taken before the connectors are read, because a connector
        // field may hold a global variable and gets its value from this same snapshot
        GlobalVariableSnapshot globalSnapshot =
                globalVariableSnapshotService.takeFor(scheduler.getConnection().getId());
        executionObj.setGlobalSnapshot(globalSnapshot);

        // a variable deleted or scoped away since the workflow was saved stops the run here,
        // before its first step, and not at the step that reads it
        globalReferenceValidator.validateRun(connectionMng, globalSnapshot);

        ConnectionEx connectionEx = connectionMapper.toEntity(connectionMng, globalSnapshot);
        connectionEx.setConnectionId(scheduler.getConnection().getId());
        connectionEx.setConnectionName(getConnectionName(scheduler.getConnection().getId()));
        executionObj.setConnection(connectionEx);

        executionObj.setWebhookVars(data.getQueryParams());

        String host = env.getProperty(AppYamlPath.PROXY_HOST, "");
        String port = env.getProperty(AppYamlPath.PROXY_PORT, "");
        String user = env.getProperty(AppYamlPath.PROXY_USER, "");
        String password = env.getProperty(AppYamlPath.PROXY_PASS, "");
        ProxyEx proxy = ProxyEx.of(host, port, user, password);
        executionObj.setProxy(proxy);

        return executionObj;
    }

    private String getConnectionName(Long connectionId) {
        Connection connection = connectionService.getById(connectionId);
        return connection.getTitle();
    }
}

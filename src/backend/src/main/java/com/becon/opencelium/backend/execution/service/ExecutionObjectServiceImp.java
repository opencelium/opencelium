package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.configuration.WebSocketConfig;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.mapper.execution.ConnectionExMapper;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import com.becon.opencelium.backend.resource.execution.Logger;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class ExecutionObjectServiceImp implements ExecutionObjectService {

    private final Environment env;
    private final ConnectionExMapper connectionMapper;
    private final SchedulerService schedulerService;
    private final ConnectionMngService connectionMngService;

    public ExecutionObjectServiceImp(
            Environment environment,
            ConnectionExMapper connectionMapper,
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("connectionMngServiceImp") ConnectionMngService connectionMngService) {
        this.connectionMapper = connectionMapper;
        this.schedulerService = schedulerService;
        this.connectionMngService = connectionMngService;
        this.env = environment;
    }

    @Override
    public ExecutionObj buildObj(QuartzJobScheduler.ScheduleData data) {
        int scheduleId = data.getScheduleId();
        Scheduler scheduler = schedulerService.getById(scheduleId);
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(scheduler.getConnection().getId());

        ExecutionObj executionObj = new ExecutionObj();
        executionObj.setConnection(connectionMapper.toEntity(connectionMng));

        executionObj.setQueryParams(data.getQueryParams());

        String host = env.getProperty(AppYamlPath.PROXY_HOST, "");
        String port = env.getProperty(AppYamlPath.PROXY_PORT, "");
        String user = env.getProperty(AppYamlPath.PROXY_USER, "");
        String password = env.getProperty(AppYamlPath.PROXY_PASS, "");
        ProxyEx proxy = new ProxyEx(host, port, user, password);
        executionObj.setProxy(proxy);

        Logger logger = new Logger();
        logger.setDebugMode(scheduler.getDebugMode());
        if (WebSocketConfig.getSchedulerId() != null) {
            logger.setWSocketOpen(scheduler.getId() == WebSocketConfig.getSchedulerId());
        }
        executionObj.setLogger(logger);

        return executionObj;
    }
}

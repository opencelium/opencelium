package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.jobexecutor.QuartzJobScheduler;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ExecutionObjectServiceImp implements ExecutionObjectService {
    @Value("${opencelium.rest_template.proxy.host}")
    private String host;
    @Value("${opencelium.rest_template.proxy.port}")
    private String port;
    @Value("${opencelium.rest_template.proxy.user}")
    private String user;
    @Value("${opencelium.rest_template.proxy.password}")
    private String password;
    private final Mapper<ConnectionEx, ConnectionMng> connectionMapper;
    private final SchedulerService schedulerService;
    private final ConnectionMngService connectionMngService;

    public ExecutionObjectServiceImp(
            Mapper<ConnectionEx, ConnectionMng> connectionMapper,
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("connectionMngServiceImp") ConnectionMngService connectionMngService) {
        this.connectionMapper = connectionMapper;
        this.schedulerService = schedulerService;
        this.connectionMngService = connectionMngService;
    }

    @Override
    public ExecutionObj buildObj(JobExecutionContext context) {
        JobDataMap dataMap = context.getMergedJobDataMap();
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) dataMap.get("data");

        int scheduleId = data.getScheduleId();
        Scheduler scheduler = schedulerService.getById(scheduleId);
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(scheduler.getConnection().getId());

        ExecutionObj executionObj = new ExecutionObj();
        executionObj.setConnection(connectionMapper.toEntity(connectionMng));

        @SuppressWarnings("unchecked")
        Map<String, String> queryParams = (Map<String, String>) dataMap.getOrDefault("queryParams", new HashMap<>());
        executionObj.setQueryParams(queryParams);

        ProxyEx proxy = new ProxyEx(host, port, user, password);
        executionObj.setProxy(proxy);
        return executionObj;
    }
}

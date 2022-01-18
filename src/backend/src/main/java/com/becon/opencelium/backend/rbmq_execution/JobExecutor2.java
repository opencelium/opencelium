package com.becon.opencelium.backend.rbmq_execution;

import com.becon.opencelium.backend.mysql.service.ConnectionService;
import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.quartz.JobExecutor;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;

public class JobExecutor2 extends QuartzJobBean {

    private static final Logger logger = LoggerFactory.getLogger(JobExecutor.class);

    @Autowired
    private ConnectionServiceImp ctionServiceImp;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {

        // getting data from context
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        Long ctionId = jobDataMap.getLongValue("connectionId");
        Integer schedulerId = jobDataMap.getIntValue("schedulerId");
        ConnectionService ctionNodeService = ctionServiceImp;
        try {
            ctionNodeService.run(ctionId);
        } catch (Exception e) {

        }
    }
}

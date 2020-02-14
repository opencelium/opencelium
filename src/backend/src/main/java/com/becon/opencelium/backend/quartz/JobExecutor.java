/*
 * // Copyright (C) <2019> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.quartz;

import com.becon.opencelium.backend.execution.ConnectionExecutor;
import com.becon.opencelium.backend.execution.ExecutionContainer;
import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.mysql.entity.Execution;
import com.becon.opencelium.backend.mysql.entity.LastExecution;
import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.mysql.service.ExecutionServiceImp;
import com.becon.opencelium.backend.mysql.service.LastExecutionServiceImp;
import com.becon.opencelium.backend.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeService;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Date;

@Component
public class JobExecutor extends QuartzJobBean {

    private static final Logger logger = LoggerFactory.getLogger(JobExecutor.class);

    @Autowired
    private ConnectionServiceImp connectionService;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

    @Autowired
    private ConnectionExecutor connectionExecutor;

    @Autowired
    private ExecutionServiceImp executionServiceImp;

    @Autowired
    private LastExecutionServiceImp lastExecutionServiceImp;

    @Autowired
    private SchedulerServiceImp schedulerServiceImp;

    @Autowired
    private ExecutionContainer executionContainer;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        logger.info("Executing Job with key {}", context.getJobDetail().getKey());
        logger.info("Firing  Trigger with key {}", context.getTrigger().getKey());
        System.out.println("==================================================================");
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        Long connectionId = jobDataMap.getLongValue("connectionId");
        Object schedulerId = jobDataMap.getIntValue("schedulerId");

        Date date= new Date();
        Execution execution = new Execution();
        LastExecution lastExecution = new LastExecution();

        Scheduler scheduler = schedulerServiceImp.findById((int)schedulerId)
                .orElseThrow(() -> new RuntimeException("Scheduler not found"));

        execution.setStartTime(date);
        execution.setScheduler(scheduler);
        executionServiceImp.save(execution);

        String taId = schedulerId + "-" + execution.getId();
        executionContainer.setTaId(taId);
        executionContainer.setOrder(0);

        if (lastExecutionServiceImp.existsBySchedulerId(scheduler.getId())){
            lastExecution = lastExecutionServiceImp.findBySchedulerId(scheduler.getId());
        }else {
            lastExecution.setScheduler(scheduler);
        }

        try {
            connectionExecutor.start(scheduler);
        }catch (Exception e){
            e.printStackTrace();
            Date end_date= new Date();
            if (schedulerId!= null){
                execution.setEndTime(end_date);
                execution.setStatus("F");
                executionServiceImp.save(execution);

                lastExecution.setFailStartTime(execution.getStartTime());
                lastExecution.setFailEndTime(execution.getEndTime());
                lastExecution.setFailExecutionId(execution.getId());

                // TODO - need to make this operation in exception handler class
                long diffInMillSeconds = Math.abs(execution.getEndTime().getTime() - execution.getStartTime().getTime());
                lastExecution.setFailDuration(diffInMillSeconds);
                lastExecutionServiceImp.save(lastExecution);
            }
            throw new RuntimeException("EXECUTION_FAILED");
        }

        if (schedulerId != null){
            Date end_date = new Date();
            Timestamp end_timestamp = new Timestamp(end_date.getTime());
            execution.setEndTime(end_timestamp);
            execution.setStatus("S");
            executionServiceImp.save(execution);

            long diffInMillSeconds = Math.abs(execution.getEndTime().getTime() - execution.getStartTime().getTime());
            lastExecution.setSuccessStartTime(execution.getStartTime());
            lastExecution.setSuccessEndTime(execution.getEndTime());
            lastExecution.setSuccessDuration(diffInMillSeconds);
            lastExecution.setSuccessExecutionId(execution.getId());
            lastExecutionServiceImp.save(lastExecution);
        }
    }
}

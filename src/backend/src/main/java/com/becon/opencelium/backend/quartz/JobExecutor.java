/*
 * // Copyright (C) <2020> <becon GmbH>
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

import com.becon.opencelium.backend.configuration.WebSocketConfig;
import com.becon.opencelium.backend.execution.ConnectionExecutor;
import com.becon.opencelium.backend.execution.ConnectorExecutor;
import com.becon.opencelium.backend.execution.ExecutionContainer;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import com.becon.opencelium.backend.execution.socket.SocketLogMessage;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Execution;
import com.becon.opencelium.backend.mysql.entity.LastExecution;
import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.service.*;
import com.becon.opencelium.backend.neo4j.service.*;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.sql.Timestamp;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JobExecutor extends QuartzJobBean {

    private static final Logger logger = LoggerFactory.getLogger(JobExecutor.class);

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

    @Autowired
    private ExecutionServiceImp executionServiceImp;

    @Autowired
    private LastExecutionServiceImp lastExecutionServiceImp;

    @Autowired
    private SchedulerServiceImp schedulerServiceImp;

    @Autowired
    private EnhancementNodeServiceImp enhancementNodeServiceImp;

    @Autowired
    private EnhancementServiceImp enhancementServiceImp;

    @Autowired
    private FieldNodeServiceImp fieldNodeServiceImp;

    @Autowired
    private MethodNodeServiceImp methodNodeServiceImp;

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private InvokerServiceImp invokerService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private BodyNodeServiceImp bodyNodeService;

    @Autowired
    private FieldNodeServiceImp fieldNodeService;

    @Autowired
    private VariableNodeServiceImp statementNodeService;

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        execution(context);
    }

    private void execution(JobExecutionContext context) {
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        Object schedulerId = jobDataMap.getIntValue("schedulerId");
        Scheduler scheduler = schedulerServiceImp.findById((int)schedulerId)
                .orElseThrow(() -> new RuntimeException("Scheduler not found"));

        boolean debugMode = scheduler.getDebugMode();
        boolean isSocketOpen = false;
        if (WebSocketConfig.schedulerId != null) {
            isSocketOpen = scheduler.getId() == WebSocketConfig.schedulerId;
        }
        ExecutionContainer executionContainer = new ExecutionContainer(enhancementServiceImp, fieldNodeServiceImp, methodNodeServiceImp);
        if(debugMode) loggAndSend("Executing Job with key " + context.getJobDetail().getKey(), isSocketOpen);
        if(debugMode) loggAndSend("Firing Trigger with key " + context.getTrigger().getKey(), isSocketOpen);
        if(debugMode) loggAndSend("==================================================================", isSocketOpen);


        Object queryParams = jobDataMap.getOrDefault("queryParams", null);
        Map<String, Object> queryParamsMap = new HashMap<>();
        if (queryParams instanceof Map) {
            queryParamsMap = (Map) queryParams;
        }

        Date date= new Date();
        Execution execution = new Execution();
        LastExecution lastExecution = new LastExecution();

        execution.setStartTime(date);
        execution.setScheduler(scheduler);
        executionServiceImp.save(execution);

        String taId = schedulerId + "-" + execution.getId();
        executionContainer.setTaId(taId);
        executionContainer.setOrder(0);
        executionContainer.setQueryParams(queryParamsMap);

        if (lastExecutionServiceImp.existsBySchedulerId(scheduler.getId())){
            lastExecution = lastExecutionServiceImp.findBySchedulerId(scheduler.getId());
        }else {
            lastExecution.setScheduler(scheduler);
        }

        try {

            ConnectorExecutor connectorExecutor = new ConnectorExecutor(invokerService, executionContainer,
                    fieldNodeServiceImp, methodNodeServiceImp,
                    connectorService, statementNodeService, simpMessagingTemplate, isSocketOpen);
            ConnectionExecutor connectionExecutor = new ConnectionExecutor(connectionNodeService, connectorService,
                    executionContainer, connectorExecutor, debugMode);
            connectionExecutor.start(scheduler);
            loggAndSend("======================END_OF_EXECUTION======================", isSocketOpen);
        }catch (Exception e){
            e.printStackTrace();
            Date end_date= new Date();
            if (schedulerId != null){
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

    private void loggAndSend(String message, boolean isSocketOpen){
        logger.info(message);

        if (isSocketOpen) {
            SocketLogMessage socketLogMessage = new SocketLogMessage(message);
            socketLogMessage.setType("info");
            simpMessagingTemplate.convertAndSend(SocketConstant.DESTINATION, socketLogMessage);
        }
    }
}

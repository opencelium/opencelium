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
import com.becon.opencelium.backend.constant.AggrConst;
import com.becon.opencelium.backend.constant.YamlPropConst;
import com.becon.opencelium.backend.execution.ConnectionExecutor;
import com.becon.opencelium.backend.execution.ConnectorExecutor;
import com.becon.opencelium.backend.execution.ExecutionContainer;
import com.becon.opencelium.backend.execution.JsResponseObject;
import com.becon.opencelium.backend.execution.log.msg.ExecutionLog;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.logger.OcLogger;
import com.becon.opencelium.backend.mysql.entity.*;
import com.becon.opencelium.backend.mysql.service.*;
import com.becon.opencelium.backend.neo4j.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.openjdk.nashorn.api.scripting.JSObject;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.sql.Timestamp;
import java.util.*;

@Component
public class JobExecutor extends QuartzJobBean {

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

    @Autowired
    private DataAggregatorServiceImp dataAggregatorServiceImp;

    @Autowired
    private Environment environment;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        execution(context);
    }

    private void execution(JobExecutionContext context) {

        JobDataMap jobDataMap = context.getMergedJobDataMap();
        Object schedulerId = jobDataMap.getIntValue("schedulerId");
        Scheduler scheduler = schedulerServiceImp.findById((int)schedulerId)
                .orElseThrow(() -> new RuntimeException("Scheduler not found"));

        boolean isSocketOpen = false;
        if (WebSocketConfig.schedulerId != null) {
            isSocketOpen = scheduler.getId() == WebSocketConfig.schedulerId;
        }
        ExecutionLog executionLogMsg = new ExecutionLog();
        OcLogger<ExecutionLog> logger = new OcLogger<>(isSocketOpen,simpMessagingTemplate,
                                                          executionLogMsg,JobExecutor.class);
        if (!scheduler.getDebugMode()) {
            logger.disable();
        }
        ExecutionContainer executionContainer = new ExecutionContainer(enhancementServiceImp, fieldNodeServiceImp, methodNodeServiceImp);
        logger.logAndSend("Executing Job with key " + context.getJobDetail().getKey());
        logger.logAndSend("Firing Trigger with key " + context.getTrigger().getKey());
        logger.logAndSend("==================================================================");


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
        String proxyHost = environment.getProperty(YamlPropConst.PROXY_HOST);
        String proxyPort = environment.getProperty(YamlPropConst.PROXY_PORT);
        try {
            ConnectorExecutor connectorExecutor = new ConnectorExecutor(invokerService, executionContainer,
                    fieldNodeServiceImp, methodNodeServiceImp,
                    connectorService, statementNodeService, logger, proxyHost, proxyPort);
            ConnectionExecutor connectionExecutor = new ConnectionExecutor(connectionNodeService, connectorService,
                    executionContainer, connectorExecutor);
            connectionExecutor.start(scheduler);

            executeAggregator(executionContainer, execution);
            logger.logAndSend("======================END_OF_EXECUTION======================");
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
            executeAggregator(executionContainer, execution);
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

    // TODO: Refactor so that Execution of aggregator should be in separate class;
    private void executeAggregator(ExecutionContainer executionContainer, Execution execution) {
        executionContainer.getMethodResponses().stream()
                .filter(mr -> mr.getAggregatorId() != null)
                .forEach(mr -> {
                    DataAggregator da = dataAggregatorServiceImp.getById(mr.getAggregatorId());
                    if (!da.isActive()) {
                        return;
                    }
                    List<JsResponseObject> responseObjects = mr.getResponseEntities()
                            .stream()
                            .map(JsResponseObject::new).toList();
                    List<ExecutionArgument> exarg = getExecutionArgs(da.getScript(), responseObjects, da.getArgs(), execution);
                    execution.setExecutionArguments(exarg);
                    if (execution.getExecutionArguments() != null && !execution.getExecutionArguments().isEmpty()) {
                        executionServiceImp.save(execution);
                    }
                });
    }

    private List<ExecutionArgument> getExecutionArgs(String script, List<JsResponseObject> responses, Set<Argument> args, Execution execution) {
        try {
            ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
            String string = new ObjectMapper().writeValueAsString(responses);
            engine.put("dataModel", string);
            JSObject obj = (JSObject)engine.eval("JSON.parse(dataModel)");
            engine.put(AggrConst.RESPONSES, obj);
            engine.eval(script);

            List<ExecutionArgument> executionArguments = new ArrayList<>();
            args.forEach(arg -> {
                Object value = engine.get(arg.getName());
                ExecutionArgument executionArgument = new ExecutionArgument();
//                ExecutionArgument.PK pk = new ExecutionArgument.PK(execution, arg);
                executionArgument.setExecution(execution);
                executionArgument.setArgument(arg);
                executionArgument.setValue(value.toString());
                executionArguments.add(executionArgument);
            });

//            args.forEach(arg -> arg.setExecutionArguments(executionArguments));
            return executionArguments;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}

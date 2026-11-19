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

import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.execution.ConnectionExecutor;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.ThreadLocalOcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.service.ExecutionObjectService;
import com.becon.opencelium.backend.execution.service.ExecutionObjectServiceImp;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import com.becon.opencelium.backend.utility.TestNameUtils;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.InterruptableJob;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Runs a connection for one schedule.
 *
 * <p>{@link DisallowConcurrentExecution} lets only one run per Quartz job go at a time. Every
 * trigger of a schedule fires the same job (cron, manual start, test run and webhook), so a
 * second start of that schedule waits for the running one. Two schedules of one connection are
 * two jobs and can still overlap.
 */
@Component
@DisallowConcurrentExecution
public class JobExecutor extends QuartzJobBean implements InterruptableJob {
    private final ExecutionObjectService executionObjectService;
    private final SubscriptionService subscriptionService;
    private final WebSocketNotificationService notificationService;
    private final Logger logger = LoggerFactory.getLogger(JobExecutor.class);

    private volatile Thread thread;

    public JobExecutor(
            @Qualifier("executionObjectServiceImp") ExecutionObjectServiceImp executionObjectService,
            @Qualifier("subscriptionServiceImpl") SubscriptionService subscriptionService,
            WebSocketNotificationService notificationService
    ) {
        this.executionObjectService = executionObjectService;
        this.subscriptionService = subscriptionService;
        this.notificationService = notificationService;
    }

    @Override
    public void executeInternal(JobExecutionContext context) {
        thread = Thread.currentThread();

        JobDataMap jobDataMap = context.getMergedJobDataMap();
        Subscription activeSub = subscriptionService.getActiveSubs();
        if (!subscriptionService.isValid(activeSub)) {
            logger.warn("Subscription is not valid");
            jobDataMap.put("licenseIsValid", false);
            return;
        }
        jobDataMap.put("licenseIsValid", true);

        long execId = jobDataMap.getLong("execId");
        long connectionId = jobDataMap.getLong("connectionId");
        boolean debugMode = jobDataMap.getBoolean("debugMode");
        String timestamp = jobDataMap.getString("timestamp");
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) jobDataMap.get("data");
        if (data == null) {
            // old schedulers do not have 'data' object.
            data = getData(jobDataMap);
            jobDataMap.put("data", data);
        }
        int schedulerId = data.getScheduleId();
        // the values of the secrets this run reads, which nothing that reports the run may show
        Set<String> hiddenTexts = Set.of();

        try {
            ExecutionObj executionObj = executionObjectService.buildObj(data);
            hiddenTexts = executionObj.getGlobalSnapshot().secretTexts();

            // setup execution logger:
            boolean loggingEnabled = debugMode || data.getExecType() == QuartzJobScheduler.TriggerType.SUPPORT_FILE;
            OcLogger<ExecutionLog> executionLogger = new OcLogger<>(loggingEnabled, new ExecutionLog(), connectionId, timestamp, execId);
            // a request, a response or an error may hold the value of a secret this run reads
            executionLogger.hide(hiddenTexts);
            ThreadLocalOcLogger.set(executionLogger);

            ConnectionExecutor executor = new ConnectionExecutor(executionObj, data.getRules());

            long startTime = System.currentTimeMillis();
            try {
                executionLogger.logAndSend("phase=EXECUTION_START id=%d connectionId=%d schedulerId=%d".formatted(execId, connectionId, schedulerId));
                logGlobalSnapshot(executionLogger, executionObj.getGlobalSnapshot());
                executor.start();
            } finally {
                executionLogger.logAndSend("phase=EXECUTION_END id=%d connectionId=%d schedulerId=%d".formatted(execId, connectionId, schedulerId));
                ThreadLocalOcLogger.clear();

                context.put("operationsEx", executor.getOperations());
            }

            // increments current_usage in subscription and saves entity in current_usage_history.
            String connectionName = executionObj.getConnection().getConnectionName();
            if (TestNameUtils.isNotTestConnection(connectionName) && data.getExecType() != QuartzJobScheduler.TriggerType.SUPPORT_FILE) {
                long operationUsage = executor.getOperations().stream().mapToInt(o -> o.getRequests().size()).sum();
                logger.info("Operation usage for Connection {} is {}", connectionName, operationUsage);
                subscriptionService.updateUsage(activeSub.getId(), executionObj.getConnection(), operationUsage, startTime);
            }
        } catch (ThreadDeath ignored) {
        } catch (Exception e) {
            ErrorResource message = new ErrorResource(e, HttpStatus.INTERNAL_SERVER_ERROR);
            message.setMessage(OcLogger.hideIn(message.getMessage(), hiddenTexts));
            notificationService.send(connectionId, message);

            throw e;
        } finally{
            thread = null;
        }
    }

    /**
     * Records which version of each global variable the run reads, so a run can be explained
     * after the variables changed. Values are not logged here, of a secret or of any other
     * variable: the request log shows them where they are used, a secret hidden.
     */
    private static void logGlobalSnapshot(OcLogger<ExecutionLog> executionLogger, GlobalVariableSnapshot snapshot) {
        if (snapshot.isEmpty()) {
            return;
        }

        String versions = snapshot.entries().stream()
                .map(entry -> entry.name() + "@" + entry.version())
                .collect(Collectors.joining(", ", "[", "]"));
        executionLogger.logAndSend("segment=GLOBAL_SNAPSHOT data=" + versions);
    }

    @Override
    public void interrupt() {
        if (thread != null) {
            thread.interrupt();
            thread = null;
        }
    }

    private QuartzJobScheduler.ScheduleData getData(JobDataMap jobDataMap) {
        Map<String, Object> queryParam = (Map<String, Object>) jobDataMap.getOrDefault("queryParams", null);
        int schedulerId = jobDataMap.getIntValue("schedulerId");
        String execType = jobDataMap.get("executionType").toString();
        QuartzJobScheduler.TriggerType triggerType =
                execType.equals("scheduler") ? QuartzJobScheduler.TriggerType.SCHEDULER : QuartzJobScheduler.TriggerType.WEBHOOK;
        return new QuartzJobScheduler.ScheduleData(schedulerId, triggerType, queryParam);
    }
}

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

import com.becon.opencelium.backend.constant.LogConstant;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.execution.executor.ConnectionExecutor;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.service.ExecutionObjectService;
import com.becon.opencelium.backend.execution.service.ExecutionObjectServiceImp;
import com.becon.opencelium.backend.execution.socket.WebSocketNotificationService;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import org.quartz.InterruptableJob;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
public class JobExecutor extends QuartzJobBean implements InterruptableJob {
    private final ExecutionObjectService executionObjectService;
    private final SubscriptionService subscriptionService;
    private final WebSocketNotificationService notificationService;
    private final SchedulerService schedulerService;
    private final Logger logger = LoggerFactory.getLogger(JobExecutor.class);

    private volatile Thread thread;

    public JobExecutor(
            @Qualifier("executionObjectServiceImp") ExecutionObjectServiceImp executionObjectService,
            @Qualifier("subscriptionServiceImpl") SubscriptionService subscriptionService,
            WebSocketNotificationService notificationService,
            SchedulerService schedulerService) {
        this.executionObjectService = executionObjectService;
        this.subscriptionService = subscriptionService;
        this.notificationService = notificationService;
        this.schedulerService = schedulerService;
    }

    @Override
    public void executeInternal(JobExecutionContext context) {
        String timestamp = LocalDateTime.now().format(LogConstant.DATE_TIME_FORMATTER);

        thread = Thread.currentThread();
        Subscription activeSub = subscriptionService.getActiveSubs();
        if (!subscriptionService.isValid(activeSub)) {
            logger.warn("Subscription is not valid");
            context.getMergedJobDataMap().put("licenseIsValid", false);
            return;
        }
        context.getMergedJobDataMap().put("licenseIsValid", true);

        long connectionId = -1;
        try {
            JobDataMap dataMap = context.getMergedJobDataMap();
            QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) dataMap.get("data");
            long execId = dataMap.getLong("execId");
            // old schedulers do not have 'data' object.
            if (data == null) {
                data = getData(dataMap);
                context.getMergedJobDataMap().put("data", data);
            }
            int schedulerId = data.getScheduleId();
            connectionId = schedulerService.getConnectionIdById(schedulerId);

            ExecutionObj executionObj = executionObjectService.buildObj(data);

            // setup execution logger:
            OcLogger<ExecutionLog> executionLogger = new OcLogger<>(
                    executionObj.getLoggerConfiguration(), new ExecutionLog(), connectionId, timestamp, execId
            );

            ConnectionExecutor executor = new ConnectionExecutor(executionObj, executionLogger, data.getRules());

            long startTime = System.currentTimeMillis();
            try {
                context.put("timestamp", timestamp);
                context.put("connectionId", connectionId);

                executionLogger.logAndSend(String.format("phase=EXECUTION_START id=%d connectionId=%d schedulerId=%d", execId, connectionId, schedulerId));
                executor.start();
            } finally {
                executionLogger.logAndSend(String.format("phase=EXECUTION_END id=%d connectionId=%d schedulerId=%d", execId, connectionId, schedulerId));
                executionLogger.close(); // release resources

                context.put("operationsEx", executor.getOperations());
            }

            // increments current_usage in subscription and saves entity in current_usage_history.
            String connectionName = executionObj.getConnection().getConnectionName();
            if (connectionName != null && !connectionName.contains("!*test_connection_") && data.getExecType() != QuartzJobScheduler.TriggerType.SUPPORT_FILE) {
                long operationUsage = executor.getOperations().stream().mapToInt(o -> o.getRequests().size()).sum();
                logger.info("Operation usage for Connection {} is {}", connectionName, operationUsage);
                subscriptionService.updateUsage(activeSub.getId(), executionObj.getConnection(), operationUsage, startTime);
            }
        } catch (ThreadDeath ignored) {
        } catch (Exception e) {
            ErrorResource message = new ErrorResource(e, HttpStatus.INTERNAL_SERVER_ERROR);
            notificationService.send(connectionId, message);

            throw e;
        } finally{
            thread = null;
        }
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

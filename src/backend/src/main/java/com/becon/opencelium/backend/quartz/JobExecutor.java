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

import com.becon.opencelium.backend.execution.ConnectionExecutor;
import com.becon.opencelium.backend.execution.service.ExecutionObjectService;
import com.becon.opencelium.backend.execution.service.ExecutionObjectServiceImp;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class JobExecutor extends QuartzJobBean implements InterruptableJob {
    private final ExecutionObjectService executionObjectService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    private Thread thread;

    public JobExecutor(@Qualifier("executionObjectServiceImp") ExecutionObjectServiceImp executionObjectService, SimpMessagingTemplate simpMessagingTemplate) {
        this.executionObjectService = executionObjectService;
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    @Override
    public void executeInternal(JobExecutionContext context) throws JobExecutionException {
        thread = Thread.currentThread();
        try {
            JobDataMap dataMap = context.getMergedJobDataMap();
            QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) dataMap.get("data");
            // old schedulers do not have 'data' object.
            if (data == null) {
                data = getData(dataMap);
                context.getMergedJobDataMap().put("data", data);
            }
            ExecutionObj executionObj = executionObjectService.buildObj(data);
            ConnectionExecutor executor = new ConnectionExecutor(executionObj, simpMessagingTemplate);

            executor.start();
            context.put("operationsEx", executor.getOperations());
        } catch (ThreadDeath ignored) {
        } finally {
            thread = null;
        }
    }

    @Override
    public void interrupt() {
        if (thread != null) {
            thread.stop();
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

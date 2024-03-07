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
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

@Component
public class JobExecutor extends QuartzJobBean {

    private final ExecutionObjectService executionObjectService;

    public JobExecutor(@Qualifier("executionObjectServiceImp") ExecutionObjectServiceImp executionObjectService) {
        this.executionObjectService = executionObjectService;
    }

    @Override
    public void executeInternal(JobExecutionContext context) throws JobExecutionException {
        JobDataMap dataMap = context.getMergedJobDataMap();
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) dataMap.get("data");
        ExecutionObj executionObj = executionObjectService.buildObj(data);
        ConnectionExecutor executor = new ConnectionExecutor(executionObj);

        executor.start();
        System.out.println("End of execution!");

    }
}

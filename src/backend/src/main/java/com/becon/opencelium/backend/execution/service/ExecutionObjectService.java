package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.jobexecutor.QuartzJobScheduler;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import org.quartz.JobExecutionContext;

public interface ExecutionObjectService {
    ExecutionObj buildObj(QuartzJobScheduler.ScheduleData data);
}

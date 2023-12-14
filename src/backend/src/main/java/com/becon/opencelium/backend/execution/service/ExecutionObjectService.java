package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.quartz.QuartzJobScheduler;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;

public interface ExecutionObjectService {
    ExecutionObj buildObj(QuartzJobScheduler.ScheduleData data);
}

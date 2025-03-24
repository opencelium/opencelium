package com.becon.opencelium.backend.subscription.quartz;

import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.service.ExtraOpsService;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.quartz.QuartzJobBean;

public class ExtraOpsJob extends QuartzJobBean {

    private final ExtraOpsService extraOpsService;

    public ExtraOpsJob(@Qualifier("extraOpsServiceImp") ExtraOpsService extraOpsService) {
        this.extraOpsService = extraOpsService;
    }

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        long extraOpsId = (long) context.getJobDetail().getJobDataMap().get("extraOpsId");
        ExtraOps extraOps = extraOpsService.findById(extraOpsId)
                .orElseThrow(() -> new RuntimeException("Extra Ops " + extraOpsId + " Not Found"));
        extraOps.setStatus(ExtraOpsStatus.EXPIRED);
        extraOpsService.save(extraOps);
    }
}

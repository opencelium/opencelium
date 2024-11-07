package com.becon.opencelium.backend.subscription.quartz;

import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryService;
import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApi;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApiFactory;
import com.becon.opencelium.backend.subscription.remoteapi.dto.UsageHistoryDto;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.ReportModule;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class OperationUsageReportJob extends QuartzJobBean {

    @Autowired
    private OperationUsageHistoryServiceImpl operationUsageHistoryService;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        RemoteApi remoteApi = RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL);
        ReportModule reportModule = remoteApi.getModule(ApiModule.OPERATION_USAGE);
        List<UsageHistoryDto> usageHistoryDtoList = operationUsageHistoryService.findAll()
                .stream().map(UsageHistoryDto::new).toList();
        if (usageHistoryDtoList.isEmpty()) {
            return;
        }
        Map<String, Object> request = Map.of("records", usageHistoryDtoList);
        try {
            reportModule.sendReport(request);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

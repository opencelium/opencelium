package com.becon.opencelium.backend.subscription.quartz;

import com.becon.opencelium.backend.api.serviceportal.ServicePortal;
import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryService;
import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryServiceImpl;
import com.becon.opencelium.backend.api.ApiClient;
import com.becon.opencelium.backend.api.ApiFactory;
import com.becon.opencelium.backend.subscription.dto.UsageHistoryDto;
import com.becon.opencelium.backend.api.enums.ApiModule;
import com.becon.opencelium.backend.api.ApiType;
import com.becon.opencelium.backend.api.module.ReportModule;
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

    private final OperationUsageHistoryService operationUsageHistoryService;
    private final ApiFactory apiFactory;

    public OperationUsageReportJob(@Qualifier("operationUsageHistoryServiceImpl") OperationUsageHistoryService operationUsageHistoryService,
                                   ApiFactory apiFactory) {
        this.operationUsageHistoryService = operationUsageHistoryService;
        this.apiFactory = apiFactory;
    }

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        ApiClient<ServicePortal> servicePortal = apiFactory.get(ApiType.SERVICE_PORTAL);
        ReportModule reportModule = servicePortal.features().operationUsage();
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

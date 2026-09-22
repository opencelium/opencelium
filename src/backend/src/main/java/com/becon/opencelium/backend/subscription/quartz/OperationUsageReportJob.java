package com.becon.opencelium.backend.subscription.quartz;

import com.becon.opencelium.backend.api.serviceportal.ServicePortal;
import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryService;
import com.becon.opencelium.backend.api.ApiClient;
import com.becon.opencelium.backend.api.factory.ApiFactory;
import com.becon.opencelium.backend.subscription.dto.UsageHistoryDto;
import com.becon.opencelium.backend.api.ApiType;
import com.becon.opencelium.backend.api.module.ReportModule;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class OperationUsageReportJob extends QuartzJobBean {

    private static final Logger logger = LoggerFactory.getLogger(OperationUsageReportJob.class);

    private final OperationUsageHistoryService operationUsageHistoryService;
    private final ApiFactory apiFactory;
    private final OnlineServicesProps onlineServicesProps;

    public OperationUsageReportJob(@Qualifier("operationUsageHistoryServiceImpl") OperationUsageHistoryService operationUsageHistoryService,
                                   ApiFactory apiFactory,
                                   OnlineServicesProps onlineServicesProps) {
        this.operationUsageHistoryService = operationUsageHistoryService;
        this.apiFactory = apiFactory;
        this.onlineServicesProps = onlineServicesProps;
    }

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        if (!onlineServicesProps.isServiceActive()) {
            logger.info("Online services are disabled ('opencelium.online-services.active');"
                    + " skipping operation usage report.");
            return;
        }
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

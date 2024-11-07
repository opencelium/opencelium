package com.becon.opencelium.backend.subscription.quartz;

import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryServiceImpl;
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
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class OperationUsageReportJob implements Job {

    private final RemoteApi remoteApi = RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL);

    @Autowired
    private OperationUsageHistoryServiceImpl operationUsageHistoryService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        ReportModule reportModule = remoteApi.getModule(ApiModule.OPERATION_USAGE);
        List<UsageHistoryDto> usageHistoryDtoList = operationUsageHistoryService.findAll()
                .stream().map(UsageHistoryDto::new).toList();
        Map<String, List<UsageHistoryDto>> request = Map.of("record", usageHistoryDtoList);
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String reportPayload = objectMapper.writeValueAsString(request);
            reportModule.sendReport(reportPayload);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

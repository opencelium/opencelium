package com.becon.opencelium.backend.unit.subscription.quartz;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.becon.opencelium.backend.api.ApiClient;
import com.becon.opencelium.backend.api.ApiType;
import com.becon.opencelium.backend.api.factory.ApiFactory;
import com.becon.opencelium.backend.api.module.ReportModule;
import com.becon.opencelium.backend.api.serviceportal.ServicePortal;
import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryService;
import com.becon.opencelium.backend.subscription.dto.UsageHistoryDto;
import com.becon.opencelium.backend.subscription.quartz.OperationUsageReportJob;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Unit tests for {@link OperationUsageReportJob}.
 *
 * {@code executeInternal} is protected (Quartz contract), so it is invoked via
 * {@link ReflectionTestUtils}; the {@code JobExecutionContext} parameter is
 * unused by the job and passed as null.
 *
 * Run with: ./gradlew test --tests "*.OperationUsageReportJobTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OperationUsageReportJob — usage report upload")
class OperationUsageReportJobTest {

    @Mock
    private OperationUsageHistoryService operationUsageHistoryService;

    @Mock
    private ApiFactory apiFactory;

    @Mock
    private ApiClient<ServicePortal> servicePortalClient;

    @Mock
    private ServicePortal servicePortalFeatures;

    @Mock
    private ReportModule reportModule;

    private OnlineServicesProps props;
    private OperationUsageReportJob job;

    @BeforeEach
    void setUp() {
        props = new OnlineServicesProps();
        job = new OperationUsageReportJob(operationUsageHistoryService, apiFactory, props);
    }

    @Test
    void executeInternalSkipsReportWhenOnlineServicesInactive() {
        props.setActive(false);

        ReflectionTestUtils.invokeMethod(job, "executeInternal", new Object[] {null});

        verifyNoInteractions(apiFactory, operationUsageHistoryService);
    }

    @Test
    void executeInternalSendsNoReportWhenUsageHistoryIsEmpty() {
        stubServicePortalChain();
        given(operationUsageHistoryService.findAll()).willReturn(List.of());

        ReflectionTestUtils.invokeMethod(job, "executeInternal", new Object[] {null});

        verify(reportModule, never()).sendReport(any());
    }

    @Test
    void executeInternalSendsReportWhenUsageHistoryExists() {
        stubServicePortalChain();
        given(operationUsageHistoryService.findAll()).willReturn(List.of(aUsageHistory()));

        ReflectionTestUtils.invokeMethod(job, "executeInternal", new Object[] {null});

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(reportModule).sendReport(payload.capture());
        @SuppressWarnings("unchecked")
        Map<String, List<UsageHistoryDto>> request = (Map<String, List<UsageHistoryDto>>) payload.getValue();
        assertThat(request).containsKey("records");
        assertThat(request.get("records")).hasSize(1);
        assertThat(request.get("records").get(0).getSubId()).isEqualTo("sub-1");
    }

    private void stubServicePortalChain() {
        given(apiFactory.get(ApiType.SERVICE_PORTAL)).willReturn(servicePortalClient);
        given(servicePortalClient.features()).willReturn(servicePortalFeatures);
        given(servicePortalFeatures.operationUsage()).willReturn(reportModule);
    }

    private static OperationUsageHistory aUsageHistory() {
        OperationUsageHistory history = new OperationUsageHistory();
        history.setId(1L);
        history.setSubId("sub-1");
        history.setLicenseId("lic-1");
        history.setConnectionTitle("jira-to-zammad");
        history.setTotalUsage(5L);
        history.setCreatedAt(LocalDateTime.of(2026, 9, 1, 0, 0));
        history.setModifiedAt(LocalDateTime.of(2026, 9, 2, 0, 0));
        return history;
    }
}

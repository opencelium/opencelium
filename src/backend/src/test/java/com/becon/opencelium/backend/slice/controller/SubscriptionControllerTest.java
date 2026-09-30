package com.becon.opencelium.backend.slice.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.api.factory.ApiFactory;
import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import com.becon.opencelium.backend.controller.SubscriptionController;
import com.becon.opencelium.backend.database.mysql.service.ActivationRequestService;
import com.becon.opencelium.backend.database.mysql.service.ExtraOpsService;
import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryService;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.mapper.mysql.ActivationRequestMapper;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Slice tests for the online-services gating in {@link SubscriptionController}.
 *
 * Only the disabled path is covered here: the controller resolves its Service
 * Portal client from {@link ApiFactory} in the constructor, so the enabled
 * path cannot be stubbed in a web slice and stays with the real integration.
 *
 * Run with: ./gradlew test --tests "*.SubscriptionControllerTest"
 */
@WebMvcTest(
        controllers = SubscriptionController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {
                        AuthenticationFilter.class,
                        AuthorizationFilter.class,
                        TotpAuthenticationFilter.class
                }
        )
)
@ActiveProfiles("test")
@DisplayName("SubscriptionController — online-services gating")
class SubscriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean(name = "subscriptionServiceImpl")
    private SubscriptionService subscriptionService;

    @MockBean(name = "activationRequestServiceImp")
    private ActivationRequestService activationRequestService;

    @MockBean(name = "operationUsageHistoryServiceImpl")
    private OperationUsageHistoryService operationUsageHistoryService;

    @MockBean(name = "extraOpsServiceImp")
    private ExtraOpsService extraOpsService;

    @MockBean
    private ActivationRequestMapper activationRequestMapper;

    @MockBean
    private ApiFactory apiFactory;

    @MockBean
    private OnlineServicesProps onlineServicesProps;

    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    @Test
    void getAllSubscriptionsReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(get("/subs/all").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));
    }

    @Test
    void checkConnectionReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(get("/subs/connection/check").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));
    }

    @Test
    void getSubByIdReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(get("/subs/{subId}", "sub-1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));
    }

    @Test
    void setSubscriptionReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(post("/subs/{subId}", "sub-1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));

        verifyNoInteractions(activationRequestService, subscriptionService);
    }
}

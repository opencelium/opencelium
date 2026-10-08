package com.becon.opencelium.backend.slice.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import com.becon.opencelium.backend.controller.InvokerController;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerRepositoryService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connector.FunctionDTO;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
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
 * Slice tests for the online-services gating in {@link InvokerController}.
 *
 * When {@code opencelium.online-services.active} is false, the endpoints that
 * call remote services (invoker repository, Service Portal sync) must return
 * 200 with a message pointing to the configuration key and must not touch the
 * backing services.
 *
 * Run with: ./gradlew test --tests "*.InvokerControllerTest"
 */
@WebMvcTest(
        controllers = InvokerController.class,
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
@DisplayName("InvokerController — online-services gating")
class InvokerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean(name = "invokerServiceImp")
    private InvokerService invokerService;

    @MockBean(name = "connectorServiceImp")
    private ConnectorService connectorService;

    @MockBean(name = "connectionServiceImp")
    private ConnectionService connectionService;

    @MockBean
    private InvokerSyncService invokerSyncService;

    @MockBean
    private InvokerRepositoryService invokerRepositoryService;

    @MockBean
    private Mapper<Invoker, InvokerDTO> invokerMapper;

    @MockBean
    private Mapper<FunctionInvoker, FunctionDTO> functionMapper;

    @MockBean
    private OnlineServicesProps onlineServicesProps;

    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    @Test
    void downloadInvokersFromRepositoryReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(post("/invoker/remote").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));

        verifyNoInteractions(invokerRepositoryService);
    }

    @Test
    void syncForceReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(put("/invoker/{invokerName}/sync-force", "jira").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));

        verifyNoInteractions(invokerSyncService);
    }

    @Test
    void syncForceByNamesReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(put("/invoker/list/sync-force")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "identifiers": ["jira", "zammad"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));

        verifyNoInteractions(invokerSyncService);
    }

    @Test
    void syncForceReturnsNoContentWhenOnlineServicesActive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(true);

        mockMvc.perform(put("/invoker/{invokerName}/sync-force", "jira").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(invokerSyncService).forceSync("jira");
    }
}

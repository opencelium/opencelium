package com.becon.opencelium.backend.slice.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.application.assistant.AssistantServiceImp;
import com.becon.opencelium.backend.application.assistant.UpdatePackageServiceImp;
import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import com.becon.opencelium.backend.controller.UpdateAssistantController;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Slice tests for the online-services gating in {@link UpdateAssistantController}.
 *
 * The two {@code /assistant/oc/online/...} endpoints call packagecloud.io;
 * with {@code opencelium.online-services.active: false} they must return 200
 * with a message pointing to the configuration key without touching the
 * update package service.
 *
 * Run with: ./gradlew test --tests "*.UpdateAssistantControllerTest"
 */
@WebMvcTest(
        controllers = UpdateAssistantController.class,
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
@DisplayName("UpdateAssistantController — online-services gating")
class UpdateAssistantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private AssistantServiceImp assistantServiceImp;

    @MockBean
    private UpdatePackageServiceImp updatePackageServiceImp;

    @MockBean
    private TemplateServiceImp templateServiceImp;

    @MockBean
    private OnlineServicesProps onlineServicesProps;

    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    @Test
    void getOnlineVersionReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(get("/assistant/oc/online/version/all").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));

        verifyNoInteractions(updatePackageServiceImp);
    }

    @Test
    void downloadVersionReturnsDisabledMessageWhenOnlineServicesInactive() throws Exception {
        when(onlineServicesProps.isServiceActive()).thenReturn(false);

        mockMvc.perform(get("/assistant/oc/online/version/{version}/download", "5.1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(containsString("opencelium.online-services.active")));

        verifyNoInteractions(updatePackageServiceImp);
    }
}

/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.applicationConfig.dto.ApplicationConfigResponse;
import com.becon.opencelium.backend.applicationConfig.dto.YamlComment;
import com.becon.opencelium.backend.applicationConfig.service.ApplicationConfigService;
import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.ApplicationConfigController;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link ApplicationConfigController}.
 *
 * Tests the controller in isolation — service is mocked, security filters are
 * excluded by application-test.yml. Authorization enforcement
 * ({@code @PreAuthorize("hasRole('ADMIN')")}) is covered by a separate
 * reflection test (see {@code ApplicationConfigControllerSecurityAnnotationsTest})
 * because activating method security in the @WebMvcTest slice without the
 * full Spring Security autoconfiguration leaves the dispatcher in a state
 * where requests no longer reach the controller.
 */
@WebMvcTest(
        controllers = ApplicationConfigController.class,
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
@DisplayName("ApplicationConfigController — web slice")
class ApplicationConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationConfigService service;

    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    private final ObjectMapper json = new ObjectMapper();

    // ── GET /application-config ───────────────────────────────────────────────

    @Test
    void getReturnsDataAndCommentsWhenServiceProducesResponse() throws Exception {
        ObjectNode data = json.createObjectNode();
        data.putObject("server").put("port", 9090);
        List<YamlComment> comments = List.of(
                new YamlComment("server.port", YamlComment.POSITION_INLINE, " default port")
        );
        when(service.read()).thenReturn(new ApplicationConfigResponse(data, comments));

        mockMvc.perform(get("/application-config").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.server.port").value(9090))
                .andExpect(jsonPath("$.comments[0].path").value("server.port"))
                .andExpect(jsonPath("$.comments[0].position").value("inline"));
    }

    @Test
    void getReturns500WhenServiceThrows() throws Exception {
        when(service.read()).thenThrow(new RuntimeException("io"));

        mockMvc.perform(get("/application-config").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    // ── PATCH /application-config ─────────────────────────────────────────────

    @Test
    void patchReturns200WithRestartRequiredFlagWhenEnvelopeAccepted() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "data": { "server": { "port": 8080 } },
                                  "comments": []
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("saved"))
                .andExpect(jsonPath("$.restartRequired").value(true))
                .andExpect(jsonPath("$.message").exists());

        verify(service).patch(any());
    }

    @Test
    void patchIgnoresCommentsFieldWhenEnvelopeAccepted() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "data": { "server": { "port": 8080 } },
                                  "comments": [
                                    { "path": "server.port", "position": "inline", "text": "ignored" }
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        // Service is invoked with the data sub-tree only — comments never reach it.
        org.mockito.ArgumentCaptor<com.fasterxml.jackson.databind.JsonNode> captor =
                org.mockito.ArgumentCaptor.forClass(com.fasterxml.jackson.databind.JsonNode.class);
        verify(service).patch(captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().has("comments")).isFalse();
        org.assertj.core.api.Assertions.assertThat(captor.getValue().get("server").get("port").asInt())
                .isEqualTo(8080);
    }

    @Test
    void patchReturns400WhenJsonBodyIsMalformed() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ not-valid-json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchReturns400WhenEnvelopeIsMissingDataField() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "comments": [] }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchReturns400WhenDataIsNotAnObject() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "data": [1, 2, 3] }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchReturns500WhenServiceThrowsWriteException() throws Exception {
        doThrow(new ApplicationConfigWriteException("io"))
                .when(service).patch(any());

        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "data": { "server": { "port": 8080 } }
                                }
                                """))
                .andExpect(status().isInternalServerError());
    }
}

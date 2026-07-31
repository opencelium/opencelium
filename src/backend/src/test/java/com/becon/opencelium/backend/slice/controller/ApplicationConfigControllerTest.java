/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.appYml.dto.ApplicationConfigResponse;
import com.becon.opencelium.backend.appYml.dto.ConfigNode;
import com.becon.opencelium.backend.appYml.dto.NodeComment;
import com.becon.opencelium.backend.appYml.service.ApplicationConfigService;
import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.ApplicationConfigController;
import com.becon.opencelium.backend.exception.ApplicationConfigValidationException;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.IntNode;
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
 * ({@code @PreAuthorize("hasAuthority('Admin')")}) is covered by a separate
 * reflection test (see {@code ApplicationConfigControllerSecurityAnnotationsTest}).
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
    void getReturnsFieldTreeAndCommentsWhenServiceProducesResponse() throws Exception {
        ConfigNode port = new ConfigNode(
                "port", "server.port", ConfigNode.ACTIVE, IntNode.valueOf(9090),
                List.of(new NodeComment(NodeComment.INLINE, " default port")));
        ConfigNode server = new ConfigNode(
                "server", "server", ConfigNode.ACTIVE, List.of(port), List.of());
        ApplicationConfigResponse response = new ApplicationConfigResponse(
                List.of(server),
                List.of(new NodeComment(NodeComment.HEADER, " banner")));
        when(service.read()).thenReturn(response);

        mockMvc.perform(get("/application-config").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fields[0].path").value("server"))
                .andExpect(jsonPath("$.fields[0].status").value("active"))
                .andExpect(jsonPath("$.fields[0].value[0].path").value("server.port"))
                .andExpect(jsonPath("$.fields[0].value[0].value").value(9090))
                .andExpect(jsonPath("$.fields[0].value[0].comments[0].position").value("inline"))
                .andExpect(jsonPath("$.comments[0].position").value("header"));
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
                                  "fields": [ { "path": "server.port", "value": 8080 } ],
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
    void patchPassesOnlyFieldsArrayToServiceWhenEnvelopeAccepted() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fields": [ { "path": "server.port", "value": 8080 } ],
                                  "comments": [ { "position": "inline", "text": "ignored" } ]
                                }
                                """))
                .andExpect(status().isOk());

        org.mockito.ArgumentCaptor<com.fasterxml.jackson.databind.JsonNode> captor =
                org.mockito.ArgumentCaptor.forClass(com.fasterxml.jackson.databind.JsonNode.class);
        verify(service).patch(captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().isArray()).isTrue();
        org.assertj.core.api.Assertions.assertThat(captor.getValue().get(0).get("path").asText())
                .isEqualTo("server.port");
    }

    @Test
    void patchReturns400WhenJsonBodyIsMalformed() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ not-valid-json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchReturns400WhenEnvelopeIsMissingFieldsArray() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "comments": [] }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchReturns400WhenFieldsIsNotAnArray() throws Exception {
        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "fields": { "path": "server.port" } }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchReturns400WhenServiceThrowsValidationException() throws Exception {
        doThrow(new ApplicationConfigValidationException("Active section 'spring.mail' must have at least one active child."))
                .when(service).patch(any());

        mockMvc.perform(patch("/application-config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "fields": [ { "path": "spring.mail", "status": "active" } ] }
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
                                { "fields": [ { "path": "server.port", "value": 8080 } ] }
                                """))
                .andExpect(status().isInternalServerError());
    }
}

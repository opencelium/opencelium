/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.ConnectorController;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for the icon endpoints of {@link ConnectorController}
 * ({@code POST/DELETE /connector/{id}/icon}).
 *
 * Web layer only — service beans are mocked. Security filters are excluded so
 * MockMvc reaches the controller directly. RuntimeExceptions thrown by the
 * service map to HTTP 500 via the catch-all exception handler.
 *
 * Run with: ./gradlew test --tests "*.ConnectorControllerTest"
 */
@WebMvcTest(
        controllers = ConnectorController.class,
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
@DisplayName("ConnectorController — icon endpoints web slice")
class ConnectorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean(name = "connectorServiceImp")
    private ConnectorService connectorService;

    @MockBean(name = "invokerServiceImp")
    private InvokerService invokerService;

    @MockBean(name = "connectionServiceImp")
    private ConnectionService connectionService;

    @MockBean
    private Mapper<Connector, ConnectorResource> connectorResourceMapper;

    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    // The interceptor is registered for "/connector/**"; let every request through so
    // it reaches the controller (a bare mock's preHandle would return false and 200-out).
    @BeforeEach
    void allowMasterPasswordInterceptor() throws Exception {
        when(masterPasswordInterceptor.preHandle(any(), any(), any())).thenReturn(true);
    }

    // ── POST /connector/{id}/icon ─────────────────────────────────────────────

    @Test
    void uploadIconReturns200WithMappedConnectorWhenFileIsStored() throws Exception {
        Connector stored = new Connector();
        stored.setId(1);
        ConnectorResource dto = new ConnectorResource();
        dto.setConnectorId(1);
        dto.setIcon("/storage/files/abc.png");
        when(connectorService.storeIcon(eq(1), any())).thenReturn(stored);
        when(connectorResourceMapper.toDTO(stored)).thenReturn(dto);

        MockMultipartFile file = new MockMultipartFile("file", "logo.png", "image/png", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/connector/{id}/icon", 1).file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connectorId").value(1))
                .andExpect(jsonPath("$.icon").value("/storage/files/abc.png"));

        verify(connectorService).storeIcon(eq(1), any());
    }

    @Test
    void uploadIconReturns500WhenServiceThrows() throws Exception {
        when(connectorService.storeIcon(eq(99), any()))
                .thenThrow(new ConnectorNotFoundException(99));

        MockMultipartFile file = new MockMultipartFile("file", "logo.png", "image/png", new byte[]{1});

        mockMvc.perform(multipart("/connector/{id}/icon", 99).file(file))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void uploadIconReturns400WhenFilePartIsMissing() throws Exception {
        mockMvc.perform(multipart("/connector/{id}/icon", 1))
                .andExpect(status().isBadRequest());
    }

    // ── DELETE /connector/{id}/icon ───────────────────────────────────────────

    @Test
    void deleteIconReturns204AndDelegatesToServiceWhenIdProvided() throws Exception {
        mockMvc.perform(delete("/connector/{id}/icon", 1))
                .andExpect(status().isNoContent());

        verify(connectorService).deleteIcon(1);
    }

    @Test
    void deleteIconReturns500WhenServiceThrows() throws Exception {
        doThrow(new ConnectorNotFoundException(99)).when(connectorService).deleteIcon(99);

        mockMvc.perform(delete("/connector/{id}/icon", 99))
                .andExpect(status().isInternalServerError());
    }
}

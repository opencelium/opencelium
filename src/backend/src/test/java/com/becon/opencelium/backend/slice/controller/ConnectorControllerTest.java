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
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.mapper.mysql.ConnectorResourceMapper;
import com.becon.opencelium.backend.resource.connector.ConnectorMetaDTO;
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

import org.mockito.InOrder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for the icon endpoints ({@code POST/DELETE /connector/{id}/icon}) and the
 * health/status endpoints ({@code GET /connector/meta/all},
 * {@code POST /connector/{id}/status/refresh}) of {@link ConnectorController}.
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
@DisplayName("ConnectorController — icon and health endpoints web slice")
class ConnectorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean(name = "connectorServiceImp")
    private ConnectorService connectorService;

    @MockBean
    private ConnectorHealthService connectorHealthService;

    @MockBean(name = "connectionServiceImp")
    private ConnectionService connectionService;

    @MockBean
    private ConnectorResourceMapper connectorResourceMapper;

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

    // ── GET /connector/meta/all ───────────────────────────────────────────────

    @Test
    void getAllMetaReturnsCredentialFreeViewWhenConnectorsExist() throws Exception {
        Connector raw = new Connector();
        raw.setId(7);
        when(connectorService.findAllRaw()).thenReturn(java.util.List.of(raw));
        when(connectorResourceMapper.toMetaDTOAll(java.util.List.of(raw)))
                .thenReturn(java.util.List.of(aMetaDto()));

        mockMvc.perform(get("/connector/meta/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].connectorId").value(7))
                .andExpect(jsonPath("$[0].title").value("jira"))
                .andExpect(jsonPath("$[0].sslCert").value(true))
                .andExpect(jsonPath("$[0].timeout").value(5000))
                .andExpect(jsonPath("$[0].status").value("DOWN"))
                .andExpect(jsonPath("$[0].lastTestError").value("refused"))
                // Epoch millis, same convention as ConnectorResource.
                .andExpect(jsonPath("$[0].lastCheckedAt").value(1722249600000L))
                // The nested invoker is reduced to its name — nothing else is shipped.
                .andExpect(jsonPath("$[0].invoker.name").value("Jira"))
                .andExpect(jsonPath("$[0].invoker.operations").doesNotExist())
                .andExpect(jsonPath("$[0].invoker.requiredData").doesNotExist());

        // The snapshot must never trigger the decrypting read.
        verify(connectorService, never()).findAll();
    }

    // ── POST /connector/{id}/status/refresh ───────────────────────────────────

    @Test
    void refreshStatusRunsCheckAndReturnsPersistedStateWhenConnectorExists() throws Exception {
        Connector decrypted = new Connector();
        decrypted.setId(7);
        Connector persisted = new Connector();
        persisted.setId(7);
        when(connectorService.getById(7)).thenReturn(decrypted);
        when(connectorService.getByIdRaw(7)).thenReturn(persisted);
        when(connectorResourceMapper.toMetaDTO(persisted)).thenReturn(aMetaDto());

        mockMvc.perform(post("/connector/{id}/status/refresh", 7))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connectorId").value(7))
                .andExpect(jsonPath("$.status").value("DOWN"));

        InOrder order = inOrder(connectorHealthService, connectorService);
        order.verify(connectorHealthService).runCheck(decrypted);
        order.verify(connectorService).getByIdRaw(7);
    }

    @Test
    void refreshStatusReturns500WhenConnectorDoesNotExist() throws Exception {
        // ConnectorNotFoundException follows the controller's existing not-found style,
        // which the catch-all exception handler maps to HTTP 500.
        when(connectorService.getById(99)).thenThrow(new ConnectorNotFoundException(99));

        mockMvc.perform(post("/connector/{id}/status/refresh", 99))
                .andExpect(status().isInternalServerError());

        verify(connectorHealthService, never()).runCheck(any());
    }

    @Test
    void refreshStatusReturnsCurrentStateWhenCheckIsAlreadyInFlight() throws Exception {
        Connector decrypted = new Connector();
        decrypted.setId(7);
        Connector persisted = new Connector();
        persisted.setId(7);
        when(connectorService.getById(7)).thenReturn(decrypted);
        when(connectorService.getByIdRaw(7)).thenReturn(persisted);
        when(connectorResourceMapper.toMetaDTO(persisted)).thenReturn(aMetaDto());
        // An in-flight check makes runCheck a silent no-op — the endpoint must still
        // answer 200 with the currently stored state instead of erroring.
        doNothing().when(connectorHealthService).runCheck(decrypted);

        mockMvc.perform(post("/connector/{id}/status/refresh", 7))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DOWN"));
    }

    private static ConnectorMetaDTO aMetaDto() {
        ConnectorMetaDTO meta = new ConnectorMetaDTO();
        meta.setConnectorId(7);
        meta.setTitle("jira");
        meta.setSslCert(true);
        meta.setTimeout(5000);
        meta.setInvoker(new ConnectorMetaDTO.InvokerMetaDTO("Jira"));
        meta.setStatus(ConnectorStatus.DOWN);
        meta.setLastTestError("refused");
        meta.setLastCheckedAt(1_722_249_600_000L);
        return meta;
    }
}

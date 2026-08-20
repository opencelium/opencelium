/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.ConnectionController;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.websocket.Connection2WebSocketChannelMapping;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link ConnectionController}: the {@code includeTest} request parameter on the
 * listing endpoints and the guarded bulk delete.
 *
 * Run with: ./gradlew test --tests "*.ConnectionControllerTest"
 */
@WebMvcTest(
        controllers = ConnectionController.class,
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
@DisplayName("ConnectionController — web slice")
class ConnectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchedulerService schedulerService;

    @MockBean
    private ConnectorService connectorService;

    @MockBean(name = "connectionServiceImp")
    private ConnectionService connectionService;

    @MockBean(name = "connectionMngServiceImp")
    private ConnectionMngService connectionMngService;

    @MockBean
    private Connection2WebSocketChannelMapping connection2ChannelMapping;

    @MockBean
    private Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;

    @MockBean
    private Mapper<Connection, ConnectionDTO> connectionMapper;

    @MockBean
    private Mapper<Connection, ConnectionResource> connectionResourceMapper;

    @MockBean
    private Mapper<ConnectionDTO, ConnectionOldDTO> connectionOldDTOMapper;

    @MockBean
    private PatchHelper patchHelper;

    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    // ── GET /connection/all ───────────────────────────────────────────────────

    @Test
    @DisplayName("GET /connection/all defaults includeTest to false")
    void getAllDefaultsIncludeTestToFalse() throws Exception {
        when(connectionService.getAllFullConnection(anyBoolean())).thenReturn(List.of());

        mockMvc.perform(get("/connection/all").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        ArgumentCaptor<Boolean> flag = ArgumentCaptor.forClass(Boolean.class);
        verify(connectionService).getAllFullConnection(flag.capture());
        assertThat(flag.getValue()).isFalse();
    }

    @Test
    @DisplayName("GET /connection/all?includeTest=true forwards the flag")
    void getAllForwardsIncludeTestTrue() throws Exception {
        when(connectionService.getAllFullConnection(anyBoolean())).thenReturn(List.of());

        mockMvc.perform(get("/connection/all").param("includeTest", "true").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        ArgumentCaptor<Boolean> flag = ArgumentCaptor.forClass(Boolean.class);
        verify(connectionService).getAllFullConnection(flag.capture());
        assertThat(flag.getValue()).isTrue();
    }

    // ── GET /connection/all/meta ──────────────────────────────────────────────

    @Test
    @DisplayName("GET /connection/all/meta?includeTest=true forwards the flag to findAll")
    void getAllMetaForwardsIncludeTestTrue() throws Exception {
        when(connectionService.findAll(anyBoolean())).thenReturn(List.of());
        when(connectionResourceMapper.toDTOAll(any())).thenReturn(new ArrayList<>());

        mockMvc.perform(get("/connection/all/meta").param("includeTest", "true").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        ArgumentCaptor<Boolean> flag = ArgumentCaptor.forClass(Boolean.class);
        verify(connectionService).findAll(flag.capture());
        assertThat(flag.getValue()).isTrue();
    }

    // ── PUT /connection/list/delete ───────────────────────────────────────────

    @Test
    @DisplayName("PUT /connection/list/delete delegates with running ids and returns 204")
    void deleteCtionByIdInDelegatesWithRunningIdsAndReturns204() throws Exception {
        when(schedulerService.getRunningConnectionIds()).thenReturn(Set.of(2L));

        mockMvc.perform(put("/connection/list/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "identifiers": [1, 2, 3] }
                                """))
                .andExpect(status().isNoContent());

        ArgumentCaptor<List<Long>> idsCaptor = ArgumentCaptor.forClass(List.class);
        verify(connectionService).deleteByIds(idsCaptor.capture(), eq(Set.of(2L)));
        assertThat(idsCaptor.getValue()).containsExactly(1L, 2L, 3L);
    }

    // ── POST /connection — malformed body ─────────────────────────────────────

    @Test
    @DisplayName("POST /connection — unknown methodType yields 400 with field path and accepted values")
    void saveReturnsReadableBadRequestWhenMethodTypeIsUnknown() throws Exception {
        mockMvc.perform(post("/connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "demo connection",
                                  "fromConnector": {
                                    "methods": [ { "name": "getUsers", "methodType": "WEBHOK" } ]
                                  }
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.path").value("/connection"))
                .andExpect(jsonPath("$.message").value(containsString("fromConnector.methods[0].methodType")))
                .andExpect(jsonPath("$.message").value(containsString("Unknown method type 'WEBHOK'")))
                .andExpect(jsonPath("$.message").value(containsString("CONNECTOR, HTTP_REQUEST, WEBHOOK")));
    }
}

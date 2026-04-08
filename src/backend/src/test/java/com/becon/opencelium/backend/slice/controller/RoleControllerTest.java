/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.controller.RoleController;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Slice tests for {@link RoleController}.
 *
 * Loads only the web layer — no service or repository beans.
 * All service calls are mocked with @MockBean.
 * Run with: ./gradlew test
 */
@WebMvcTest(RoleController.class)
@ActiveProfiles("test")
@DisplayName("RoleController — web slice")
class RoleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRoleServiceImpl userRoleService;

    // ── GET /role/{id} ────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /role/{id} returns 200 with role body when role exists")
    void getByIdReturns200WithBodyWhenRoleExists() throws Exception {
        UserRole role = UserRoleFixture.anAdminRole();
        when(userRoleService.findById(2)).thenReturn(Optional.of(role));

        mockMvc.perform(get("/role/2")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("ROLE_ADMIN"))
                .andExpect(jsonPath("$.description").value("Administrator role"));
    }

    @Test
    @DisplayName("GET /role/{id} returns 404 when role does not exist")
    void getByIdReturns404WhenRoleNotFound() throws Exception {
        when(userRoleService.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(get("/role/99")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    // ── POST /role ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /role returns 409 when role name already exists")
    void postReturns409WhenRoleNameAlreadyExists() throws Exception {
        when(userRoleService.existsByRole("ROLE_ADMIN")).thenReturn(true);

        mockMvc.perform(post("/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "ROLE_ADMIN",
                                  "description": "Administrator role"
                                }
                                """))
                .andExpect(status().isConflict());
    }
}

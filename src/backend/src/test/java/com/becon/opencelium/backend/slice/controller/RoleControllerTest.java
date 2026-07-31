/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.RoleController;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.database.mysql.service.PermissionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.RoleHasPermissionServiceImp;
import com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.testutil.fixture.UserRoleFixture;
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

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link RoleController}.
 *
 * Loads only the web layer — no service or repository beans.
 * All service calls are mocked with @MockBean.
 * Security auto-config is excluded by application-test.yml, so no filters
 * stand between MockMvc and the controller.
 *
 * Run with: ./gradlew test
 */
@WebMvcTest(
        controllers = RoleController.class,
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
@DisplayName("RoleController — web slice")
class RoleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRoleServiceImpl userRoleService;

    @MockBean
    private RoleHasPermissionServiceImp roleHasPermissionServiceImp;

    @MockBean
    private PermissionServiceImpl permissionService;

    @MockBean
    private StorageService storageService;

    // Pulled in by RegisterInterceptorsConfig (a WebMvcConfigurer that this slice loads).
    // Mocking the interceptor avoids resolving its ConnectorProps @ConfigurationProperties bean,
    // which isn't part of the web slice.
    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;


    // ── GET /role/{id} ────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /role/{id} returns 200 with role body when role exists")
    void getByIdReturns200WithBodyWhenRoleExists() throws Exception {
        UserRole role = UserRoleFixture.anAdminRole();
        when(userRoleService.findById(role.getId())).thenReturn(Optional.of(role));

        mockMvc.perform(get("/role/{id}", role.getId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupId").value(role.getId()))
                .andExpect(jsonPath("$.name").value("ROLE_ADMIN"))
                .andExpect(jsonPath("$.description").value("Administrator role"));
    }

    @Test
    @DisplayName("GET /role/{id} returns 500 when role does not exist")
    void getByIdReturns500WhenRoleNotFound() throws Exception {
        // RoleNotFoundException has no @ResponseStatus and no dedicated
        // @ExceptionHandler, so the catch-all handler in
        // ResponseExceptionHandler maps it to 500. Asserting the real
        // behaviour here — change this to 404 if/when the handler is updated.
        when(userRoleService.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(get("/role/{id}", 99)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    // ── POST /role ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /role returns 500 when role name already exists")
    void postReturns500WhenRoleNameAlreadyExists() throws Exception {
        // RoleExistsException has no @ResponseStatus and no dedicated
        // @ExceptionHandler, so the catch-all handler in
        // ResponseExceptionHandler maps it to 500. Asserting the real
        // behaviour here — change this to 409 if/when the handler is updated.
        when(userRoleService.existsByRole("ROLE_ADMIN")).thenReturn(true);

        mockMvc.perform(post("/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "ROLE_ADMIN",
                                  "description": "Administrator role"
                                }
                                """))
                .andExpect(status().isInternalServerError());
    }
}

/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.SystemSettingController;
import com.becon.opencelium.backend.database.mysql.entity.SystemSetting;
import com.becon.opencelium.backend.database.mysql.service.SystemSettingService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link SystemSettingController}. The service is mocked and security filters are
 * excluded by application-test.yml; authorization enforcement is covered by the reflective
 * {@code SystemSettingControllerSecurityAnnotationsTest}.
 */
@WebMvcTest(
        controllers = SystemSettingController.class,
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
@DisplayName("SystemSettingController — web slice")
class SystemSettingControllerTest {

    private static final String THEME_COLORS_JSON = "{\"primary\":\"#112233\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SystemSettingService service;

    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    private final ObjectMapper json = new ObjectMapper();

    // ── GET /system-setting/{name} ────────────────────────────────────────────

    @Test
    void getReturnsSettingWithValueAsObjectWhenPresent() throws Exception {
        SystemSetting setting = settingOf("theme_colors", THEME_COLORS_JSON);
        when(service.find("theme_colors")).thenReturn(Optional.of(setting));
        when(service.toJson(setting)).thenReturn(json.readTree(THEME_COLORS_JSON));

        mockMvc.perform(get("/system-setting/theme_colors").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("theme_colors"))
                .andExpect(jsonPath("$.value.primary").value("#112233"));
    }

    @Test
    void getReturns404WhenSettingIsAbsent() throws Exception {
        when(service.find(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(get("/system-setting/theme_colors").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    // ── PUT /system-setting/{name} ────────────────────────────────────────────

    @Test
    void putReturnsSavedSettingWhenBodyIsValid() throws Exception {
        SystemSetting saved = settingOf("theme_colors", THEME_COLORS_JSON);
        when(service.save(eq("theme_colors"), any(JsonNode.class))).thenReturn(saved);
        when(service.toJson(saved)).thenReturn(json.readTree(THEME_COLORS_JSON));

        mockMvc.perform(put("/system-setting/theme_colors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\":{\"primary\":\"#112233\"}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("theme_colors"))
                .andExpect(jsonPath("$.value.primary").value("#112233"));

        verify(service).save("theme_colors", json.readTree(THEME_COLORS_JSON));
    }

    @Test
    void putReturns400WhenValueIsMissing() throws Exception {
        mockMvc.perform(put("/system-setting/theme_colors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void putReturns400WhenBodyIsMalformedJson() throws Exception {
        mockMvc.perform(put("/system-setting/theme_colors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {not json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void putReturns400WhenServiceRejectsValue() throws Exception {
        when(service.save(anyString(), any(JsonNode.class))).thenThrow(new GeneralServiceException(
                HttpStatus.BAD_REQUEST, "INVALID_SYSTEM_SETTING_VALUE", "value too long"));

        mockMvc.perform(put("/system-setting/theme_colors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\":{\"primary\":\"#112233\"}}"))
                .andExpect(status().isBadRequest());
    }

    // ── DELETE /system-setting/{name} ─────────────────────────────────────────

    @Test
    void deleteReturns204WhenCalled() throws Exception {
        mockMvc.perform(delete("/system-setting/theme_colors"))
                .andExpect(status().isNoContent());

        verify(service).delete("theme_colors");
    }

    private static SystemSetting settingOf(String name, String value) {
        SystemSetting setting = new SystemSetting();
        setting.setName(name);
        setting.setValue(value);
        return setting;
    }
}

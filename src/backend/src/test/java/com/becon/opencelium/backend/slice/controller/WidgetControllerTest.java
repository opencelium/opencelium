/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.WidgetController;
import com.becon.opencelium.backend.database.mysql.service.WidgetDataService;
import com.becon.opencelium.backend.database.mysql.service.WidgetService;
import com.becon.opencelium.backend.resource.application.ExecutionsTimelineDTO;
import com.becon.opencelium.backend.resource.application.TopWorkflowsDTO;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for {@link WidgetController}'s data endpoints.
 *
 * Loads only the web layer; security filters are excluded so MockMvc reaches
 * the controller directly. Bad query params raise a ResponseStatusException,
 * which Spring resolves to the declared status (400).
 *
 * Run with: ./gradlew test --tests "*.WidgetControllerTest"
 */
@WebMvcTest(
        controllers = WidgetController.class,
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
@DisplayName("WidgetController — web slice")
class WidgetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WidgetService widgetService;

    @MockBean
    private WidgetDataService widgetDataService;

    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    // ── GET /widget/executions-timeline ───────────────────────────────────────

    @Test
    void getExecutionsTimelineReturns200WithPointsWhenServiceReturnsData() throws Exception {
        ExecutionsTimelineDTO dto = new ExecutionsTimelineDTO(List.of(
                new ExecutionsTimelineDTO.Point(LocalDate.of(2026, 6, 21), DayOfWeek.SATURDAY, 124, 18)));
        when(widgetDataService.getExecutionsTimeline(7)).thenReturn(dto);

        mockMvc.perform(get("/widget/executions-timeline").param("days", "7")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points.length()").value(1))
                .andExpect(jsonPath("$.points[0].dayOfWeek").value("SATURDAY"))
                .andExpect(jsonPath("$.points[0].executions").value(124))
                .andExpect(jsonPath("$.points[0].failures").value(18));
    }

    @Test
    void getExecutionsTimelineDefaultsToSevenDaysWhenDaysOmitted() throws Exception {
        when(widgetDataService.getExecutionsTimeline(7))
                .thenReturn(new ExecutionsTimelineDTO(List.of()));

        mockMvc.perform(get("/widget/executions-timeline").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(widgetDataService).getExecutionsTimeline(7);
    }

    @Test
    void getExecutionsTimelineReturns400WhenDaysIsNotPositive() throws Exception {
        mockMvc.perform(get("/widget/executions-timeline").param("days", "0")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    // ── GET /widget/top-workflows ─────────────────────────────────────────────

    @Test
    void getTopWorkflowsReturns200WithRowsWhenServiceReturnsData() throws Exception {
        TopWorkflowsDTO dto = new TopWorkflowsDTO(List.of(
                new TopWorkflowsDTO.Row(12, "SAP_to_Salesforce", 1245, 4.2)));
        when(widgetDataService.getTopWorkflows(5)).thenReturn(dto);

        mockMvc.perform(get("/widget/top-workflows").param("limit", "5")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows.length()").value(1))
                .andExpect(jsonPath("$.rows[0].connectionId").value(12))
                .andExpect(jsonPath("$.rows[0].title").value("SAP_to_Salesforce"))
                .andExpect(jsonPath("$.rows[0].executions").value(1245))
                .andExpect(jsonPath("$.rows[0].failureRate").value(4.2));
    }

    @Test
    void getTopWorkflowsDefaultsToLimitFiveWhenLimitOmitted() throws Exception {
        when(widgetDataService.getTopWorkflows(5)).thenReturn(new TopWorkflowsDTO(List.of()));

        mockMvc.perform(get("/widget/top-workflows").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(widgetDataService).getTopWorkflows(5);
    }

    @Test
    void getTopWorkflowsReturns400WhenLimitIsNotPositive() throws Exception {
        mockMvc.perform(get("/widget/top-workflows").param("limit", "0")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}

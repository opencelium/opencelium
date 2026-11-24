/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.slice.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.SchedulerController;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.database.mysql.service.WebhookServiceImp;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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

/**
 * Slice tests for the manual starts of {@link SchedulerController}: a start that the global
 * variable run gate refuses reaches the client as 409 with code BUSY, not as a 500.
 *
 * <p>Run with: ./gradlew test --tests "*.SchedulerControllerTest"
 */
@WebMvcTest(
        controllers = SchedulerController.class,
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
@DisplayName("SchedulerController — web slice")
class SchedulerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchedulerServiceImp schedulerService;

    @MockBean
    private WebhookServiceImp webhookService;

    @MockBean
    private WebSocketNotificationService notificationService;

    // Pulled in by RegisterInterceptorsConfig (a WebMvcConfigurer the slice loads).
    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    // ── GET /scheduler/execute/{schedulerId} ──────────────────────────────────

    @Test
    void executeStartsScheduleWhenWorkflowIsFree() throws Exception {
        Scheduler schedule = aSchedule();
        when(schedulerService.findById(5)).thenReturn(Optional.of(schedule));

        mockMvc.perform(get("/scheduler/execute/{schedulerId}", 5))
                .andExpect(status().isOk());

        verify(schedulerService).startNow(schedule);
    }

    @Test
    @DisplayName("execute — a start the run gate refuses answers 409 BUSY, not 500")
    void executeReturnsConflictWhenRunGateRefusesStart() throws Exception {
        Scheduler schedule = aSchedule();
        when(schedulerService.findById(5)).thenReturn(Optional.of(schedule));
        doThrow(aBusyRefusal()).when(schedulerService).startNow(schedule);

        mockMvc.perform(get("/scheduler/execute/{schedulerId}", 5))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("GLOBAL_VARIABLE_CONFLICT"))
                .andExpect(jsonPath("$.code").value("BUSY"))
                .andExpect(jsonPath("$.message").value(containsString("lastSync")))
                .andExpect(jsonPath("$.path").value("/scheduler/execute/5"));
    }

    @Test
    @DisplayName("execute — an unknown schedule answers 500 with the bare reason and starts nothing")
    void executeReturnsServerErrorWhenScheduleDoesNotExist() throws Exception {
        when(schedulerService.findById(5)).thenReturn(Optional.empty());

        mockMvc.perform(get("/scheduler/execute/{schedulerId}", 5))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("SCHEDULER_NOT_FOUND"));

        verify(schedulerService, never()).startNow(any(Scheduler.class));
    }

    // ── PUT /scheduler/startAll ───────────────────────────────────────────────

    @Test
    @DisplayName("startAll — a start the run gate refuses answers 409 BUSY, not 500")
    void startAllReturnsConflictWhenRunGateRefusesStart() throws Exception {
        Scheduler schedule = aSchedule();
        when(schedulerService.findAllById(new ArrayList<>(List.of(5)))).thenReturn(List.of(schedule));
        doThrow(aBusyRefusal()).when(schedulerService).startNow(schedule);

        mockMvc.perform(put("/scheduler/startAll")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifiers\": [5]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BUSY"))
                .andExpect(jsonPath("$.path").value("/scheduler/startAll"));
    }

    /** Schedule 5 of workflow 42. */
    private static Scheduler aSchedule() {
        Scheduler schedule = GlobalVariableFixture.aScheduleOf(42L, null);
        schedule.setId(5);
        return schedule;
    }

    private static GlobalVariableConflictException aBusyRefusal() {
        return new GlobalVariableConflictException(GlobalVariableConflictException.Code.BUSY,
                "Global variable 'lastSync' is busy: execution 7 of the workflow is running and its busy policy"
                        + " is REFUSE",
                3);
    }
}

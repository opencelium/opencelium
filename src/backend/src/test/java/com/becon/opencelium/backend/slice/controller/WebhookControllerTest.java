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
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.becon.opencelium.backend.configuration.interceptors.MasterPasswordInterceptor;
import com.becon.opencelium.backend.controller.WebhookController;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.entity.Webhook;
import com.becon.opencelium.backend.database.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.database.mysql.service.WebhookServiceImp;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.resource.webhook.WebhookTokenResource;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
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
 * Slice tests for the webhook starts of {@link WebhookController}: a webhook without data and one
 * with data each reach their own start of the schedule, and a start that the global variable run
 * gate refuses reaches the caller as 409 with code BUSY, not as a 500.
 *
 * <p>Run with: ./gradlew test --tests "*.WebhookControllerTest"
 */
@WebMvcTest(
        controllers = WebhookController.class,
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
@DisplayName("WebhookController — web slice")
class WebhookControllerTest {

    private static final String TOKEN = "tok-1";
    private static final String WEBHOOK_UUID = "6f1c2a9e-4b7d-4e0a-9c3f-2d8b5e1a7c40";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchedulerServiceImp schedulerService;

    @MockBean
    private WebhookServiceImp webhookService;

    // Pulled in by RegisterInterceptorsConfig (a WebMvcConfigurer the slice loads).
    @MockBean
    private MasterPasswordInterceptor masterPasswordInterceptor;

    /** Schedule 5 of workflow 42, which the webhook of {@link #TOKEN} starts. */
    private Scheduler schedule;

    @BeforeEach
    void setUp() {
        schedule = GlobalVariableFixture.aScheduleOf(42L, null);
        schedule.setId(5);
        Webhook webhook = new Webhook();
        webhook.setUuid(WEBHOOK_UUID);
        when(webhookService.getTokenObject(TOKEN))
                .thenReturn(Optional.of(new WebhookTokenResource(1, WEBHOOK_UUID, 5)));
        when(webhookService.findByUIID(WEBHOOK_UUID)).thenReturn(Optional.of(webhook));
        when(schedulerService.findById(5)).thenReturn(Optional.of(schedule));
    }

    // ── GET /webhook/execute/{token} ──────────────────────────────────────────

    @Test
    void executeConnectionStartsWithoutDataWhenQueryIsEmpty() throws Exception {
        mockMvc.perform(get("/webhook/execute/{token}", TOKEN))
                .andExpect(status().isOk());

        verify(schedulerService).startNowByWebhook(schedule);
        verify(schedulerService, never()).startNow(any(Scheduler.class), anyMap());
    }

    @Test
    void executeConnectionStartsWithQueryDataWhenQueryIsGiven() throws Exception {
        Map<String, Object> converted = Map.of("orderId", List.of("A-17"));
        when(webhookService.convertToArrayList(Map.<String, Object>of("orderId", "A-17"))).thenReturn(converted);

        mockMvc.perform(get("/webhook/execute/{token}", TOKEN).param("orderId", "A-17"))
                .andExpect(status().isOk());

        verify(schedulerService).startNow(schedule, converted);
        verify(schedulerService, never()).startNowByWebhook(schedule);
    }

    @Test
    @DisplayName("GET with data — a start the run gate refuses answers 409 BUSY, not 500")
    void executeConnectionReturnsConflictWhenStartWithDataIsRefused() throws Exception {
        Map<String, Object> converted = Map.of("orderId", List.of("A-17"));
        when(webhookService.convertToArrayList(Map.<String, Object>of("orderId", "A-17"))).thenReturn(converted);
        doThrow(aBusyRefusal()).when(schedulerService).startNow(schedule, converted);

        mockMvc.perform(get("/webhook/execute/{token}", TOKEN).param("orderId", "A-17"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("GLOBAL_VARIABLE_CONFLICT"))
                .andExpect(jsonPath("$.code").value("BUSY"))
                .andExpect(jsonPath("$.message").value(containsString("lastSync")))
                .andExpect(jsonPath("$.path").value("/webhook/execute/" + TOKEN));
    }

    @Test
    void executeConnectionStartsNothingWhenTokenIsUnknown() throws Exception {
        when(webhookService.getTokenObject("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(get("/webhook/execute/{token}", "unknown"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("TOKEN_NOT_FOUND"));

        verifyNoInteractions(schedulerService);
    }

    // ── POST /webhook/execute/{token} ─────────────────────────────────────────

    @Test
    void executeConnStartsWithMergedDataWhenBodyIsGiven() throws Exception {
        Map<String, Object> merged = Map.of("orderId", "A-17", "channel", "web");
        when(webhookService.mergeParams(
                Map.<String, Object>of("orderId", "A-17"), Map.<String, Object>of("channel", "web")))
                .thenReturn(merged);

        mockMvc.perform(post("/webhook/execute/{token}", TOKEN)
                        .param("channel", "web")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\": \"A-17\"}"))
                .andExpect(status().isOk());

        verify(schedulerService).startNow(schedule, merged);
        verify(schedulerService, never()).startNowByWebhook(schedule);
    }

    @Test
    void executeConnStartsWithoutDataWhenBodyIsEmpty() throws Exception {
        mockMvc.perform(post("/webhook/execute/{token}", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        verify(schedulerService).startNowByWebhook(schedule);
        verify(schedulerService, never()).startNow(any(Scheduler.class), anyMap());
    }

    @Test
    @DisplayName("POST without data — a start the run gate refuses answers 409 BUSY, not 500")
    void executeConnReturnsConflictWhenStartWithoutDataIsRefused() throws Exception {
        doThrow(aBusyRefusal()).when(schedulerService).startNowByWebhook(schedule);

        mockMvc.perform(post("/webhook/execute/{token}", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("GLOBAL_VARIABLE_CONFLICT"))
                .andExpect(jsonPath("$.code").value("BUSY"))
                .andExpect(jsonPath("$.message").value(containsString("lastSync")))
                .andExpect(jsonPath("$.path").value("/webhook/execute/" + TOKEN));
    }

    private static GlobalVariableConflictException aBusyRefusal() {
        return new GlobalVariableConflictException(GlobalVariableConflictException.Code.BUSY,
                "Global variable 'lastSync' is busy: execution 7 of the workflow is running and its busy policy"
                        + " is REFUSE",
                3);
    }
}

/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.repository.ExecutionRepository;
import com.becon.opencelium.backend.database.mysql.repository.projection.DailyExecutionStatsProjection;
import com.becon.opencelium.backend.database.mysql.repository.projection.TopWorkflowProjection;
import com.becon.opencelium.backend.database.mysql.service.WidgetDataServiceImp;
import com.becon.opencelium.backend.resource.application.ExecutionsTimelineDTO;
import com.becon.opencelium.backend.resource.application.TopWorkflowsDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link WidgetDataServiceImp}.
 *
 * The repository is mocked; projection rows are Mockito mocks of the projection
 * interfaces. The service uses {@link LocalDate#now()} internally, so date
 * assertions are made relative to today rather than against a fixed date.
 *
 * Run with: ./gradlew test --tests "*.WidgetDataServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WidgetDataServiceImp — unit")
class WidgetDataServiceImpTest {

    @Mock
    private ExecutionRepository executionRepository;

    private WidgetDataServiceImp service;

    @BeforeEach
    void setUp() {
        service = new WidgetDataServiceImp(executionRepository);
    }

    // ── getExecutionsTimeline ─────────────────────────────────────────────────

    @Test
    void getExecutionsTimelineReturnsOnePointPerDayInclusiveOfTodayWhenDaysIs7() {
        when(executionRepository.getDailyStatsSince(any(LocalDateTime.class))).thenReturn(List.of());

        ExecutionsTimelineDTO dto = service.getExecutionsTimeline(7);

        LocalDate today = LocalDate.now();
        assertThat(dto.points()).hasSize(7);
        assertThat(dto.points().get(0).date()).isEqualTo(today.minusDays(6));
        assertThat(dto.points().get(6).date()).isEqualTo(today);
        assertThat(dto.points().get(6).dayOfWeek()).isEqualTo(today.getDayOfWeek());
    }

    @Test
    void getExecutionsTimelineZeroFillsDaysWithoutExecutions() {
        LocalDate today = LocalDate.now();
        DailyExecutionStatsProjection todayStat = dailyStat(today, 10, 2);
        when(executionRepository.getDailyStatsSince(any(LocalDateTime.class)))
                .thenReturn(List.of(todayStat));

        ExecutionsTimelineDTO dto = service.getExecutionsTimeline(7);

        ExecutionsTimelineDTO.Point todayPoint = dto.points().get(6);
        assertThat(todayPoint.executions()).isEqualTo(10);
        assertThat(todayPoint.failures()).isEqualTo(2);
        assertThat(dto.points().subList(0, 6)).allSatisfy(p -> {
            assertThat(p.executions()).isZero();
            assertThat(p.failures()).isZero();
        });
    }

    @Test
    void getExecutionsTimelineReturnsSinglePointWhenDaysIs1() {
        when(executionRepository.getDailyStatsSince(any(LocalDateTime.class))).thenReturn(List.of());

        ExecutionsTimelineDTO dto = service.getExecutionsTimeline(1);

        assertThat(dto.points()).hasSize(1);
        assertThat(dto.points().get(0).date()).isEqualTo(LocalDate.now());
    }

    // ── getTopWorkflows ───────────────────────────────────────────────────────

    @Test
    void getTopWorkflowsMapsProjectionsToRows() {
        TopWorkflowProjection p = topWorkflow(12L, "SAP_to_Salesforce", 1245L, 4.2);
        when(executionRepository.getTopWorkflows(5)).thenReturn(List.of(p));

        TopWorkflowsDTO dto = service.getTopWorkflows(5);

        assertThat(dto.rows()).hasSize(1);
        TopWorkflowsDTO.Row row = dto.rows().get(0);
        assertThat(row.connectionId()).isEqualTo(12L);
        assertThat(row.title()).isEqualTo("SAP_to_Salesforce");
        assertThat(row.executions()).isEqualTo(1245L);
        assertThat(row.failureRate()).isEqualTo(4.2);
    }

    @Test
    void getTopWorkflowsRoundsFailureRateToOneDecimal() {
        TopWorkflowProjection p = topWorkflow(1L, "KIA_Tickets", 624L, 11.7654);
        when(executionRepository.getTopWorkflows(5)).thenReturn(List.of(p));

        TopWorkflowsDTO dto = service.getTopWorkflows(5);

        assertThat(dto.rows().get(0).failureRate()).isEqualTo(11.8);
    }

    @Test
    void getTopWorkflowsTreatsNullFailureRateAsZero() {
        TopWorkflowProjection p = topWorkflow(1L, "Empty", 0L, null);
        when(executionRepository.getTopWorkflows(5)).thenReturn(List.of(p));

        TopWorkflowsDTO dto = service.getTopWorkflows(5);

        assertThat(dto.rows().get(0).failureRate()).isZero();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static DailyExecutionStatsProjection dailyStat(LocalDate day, long execs, long fails) {
        DailyExecutionStatsProjection p = mock(DailyExecutionStatsProjection.class);
        when(p.getDay()).thenReturn(Date.valueOf(day));
        when(p.getExecutions()).thenReturn(execs);
        when(p.getFailures()).thenReturn(fails);
        return p;
    }

    private static TopWorkflowProjection topWorkflow(Long id, String title, Long execs, Double rate) {
        TopWorkflowProjection p = mock(TopWorkflowProjection.class);
        when(p.getConnectionId()).thenReturn(id);
        when(p.getTitle()).thenReturn(title);
        when(p.getExecutions()).thenReturn(execs);
        when(p.getFailureRate()).thenReturn(rate);
        return p;
    }
}

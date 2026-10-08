/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.repository.WidgetRepository;
import com.becon.opencelium.backend.database.mysql.service.ExecutionService;
import com.becon.opencelium.backend.database.mysql.service.WidgetServiceImp;
import com.becon.opencelium.backend.resource.application.ExecutionStatsDTO;
import com.becon.opencelium.backend.resource.application.SystemMetricsDTO;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import com.becon.opencelium.backend.testutil.assertion.WidgetAssertions;
import com.becon.opencelium.backend.testutil.fixture.WidgetFixture;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link WidgetServiceImp}.
 *
 * No Spring context is loaded. The repository and execution service are mocked with Mockito.
 * MeterRegistry uses a real SimpleMeterRegistry — see setUp() for the reasoning.
 * MeterRegistry uses SimpleMeterRegistry (a real no-op implementation) to avoid
 * ByteBuddy instrumentation issues with abstract JDK classes on newer JDK versions.
 * Run with: ./gradlew test --tests "*.WidgetServiceImplTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WidgetServiceImp — unit")
class WidgetServiceImplTest {

    @Mock
    private WidgetRepository widgetRepository;

    @Mock
    private ExecutionService executionService;

    private final SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();

    private WidgetServiceImp widgetService;

    @BeforeEach
    void setUp() {
        widgetService = new WidgetServiceImp(widgetRepository, executionService, meterRegistry);
    }

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    void savePersistsWidgetWhenCalled() {
        Widget widget = WidgetFixture.aWidget();

        widgetService.save(widget);

        verify(widgetRepository).save(widget);
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findByIdReturnsWidgetWhenIdExists() {
        Widget widget = WidgetFixture.aWidget();
        when(widgetRepository.findById(1)).thenReturn(Optional.of(widget));

        Optional<Widget> result = widgetService.findById(1);

        assertThat(result).isPresent();
        WidgetAssertions.assertThat(result.get()).isSystemMetricsWidget();
    }

    @Test
    void findByIdReturnsEmptyWhenIdDoesNotExist() {
        when(widgetRepository.findById(99)).thenReturn(Optional.empty());

        assertThat(widgetService.findById(99)).isEmpty();
    }

    // ── deleteById ────────────────────────────────────────────────────────────

    @Test
    void deleteByIdRemovesWidgetWhenIdProvided() {
        widgetService.deleteById(1);

        verify(widgetRepository).deleteById(1);
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAllReturnsAllWidgetsWhenRepositoryHasEntries() {
        Widget widget = WidgetFixture.aWidget();
        when(widgetRepository.findAll()).thenReturn(List.of(widget));

        List<Widget> result = widgetService.findAll();

        assertThat(result).hasSize(1);
        WidgetAssertions.assertThat(result.get(0)).isSystemMetricsWidget();
    }

    // ── toEntity / toResource ─────────────────────────────────────────────────

    @Test
    void toEntityConvertsResourceToWidgetWhenResourceIsValid() {
        WidgetResource resource = WidgetFixture.aWidgetResource();

        Widget entity = widgetService.toEntity(resource);

        WidgetAssertions.assertThat(entity).isSystemMetricsWidget();
    }

    @Test
    void toResourceConvertsWidgetToResourceWhenWidgetIsValid() {
        Widget widget = WidgetFixture.aWidget();

        WidgetResource resource = widgetService.toResource(widget);

        assertThat(resource.getWidgetId()).isEqualTo(1);
        assertThat(resource.getI()).isEqualTo("system-metrics");
        assertThat(resource.getIcon()).isEqualTo("metrics-icon.png");
        assertThat(resource.getTooltipTranslationKey()).isEqualTo("widget.system_metrics");
    }

    // ── getSystemMetrics ──────────────────────────────────────────────────────

    @Test
    void getSystemMetricsReturnsExecutionStatsWhenServiceReturnsData() {
        when(executionService.getStats())
                .thenReturn(new ExecutionStatsDTO(10, 2, 5000L, 500L));
        Gauge.builder("process.cpu.usage", () -> 0.0).register(meterRegistry);

        SystemMetricsDTO dto = widgetService.getSystemMetrics();

        assertThat(dto.getTotalExecs()).isEqualTo(10);
        assertThat(dto.getTotalFailedExecs()).isEqualTo(2);
        assertThat(dto.getTotalRuntime()).isEqualTo(5000L);
        assertThat(dto.getAverageRuntimeS()).isEqualTo(500L);
    }

    @Test
    @DisplayName("getSystemMetrics scales the gauge ratio (0.0–1.0) to a percentage (0–100)")
    void getSystemMetricsReturnsCpuUsagePercentageWhenGaugeIsRegistered() {
        when(executionService.getStats())
                .thenReturn(new ExecutionStatsDTO(0, 0, 0L, 0L));
        Gauge.builder("process.cpu.usage", () -> 0.50).register(meterRegistry);

        SystemMetricsDTO dto = widgetService.getSystemMetrics();

        assertThat(dto.getCpuUsage()).isEqualTo(50.0);
    }

    @Test
    void getSystemMetricsReturnsCpuUsageNullWhenGaugeIsNotRegistered() {
        when(executionService.getStats())
                .thenReturn(new ExecutionStatsDTO(0, 0, 0L, 0L));
        // No gauge registered — MeterNotFoundException is caught and logged at ERROR; that is expected here.

        SystemMetricsDTO dto = widgetService.getSystemMetrics();

        assertThat(dto.getCpuUsage()).isNull();
    }

    @Test
    @DisplayName("getSystemMetrics swallows execution-service exceptions and continues populating independent metrics")
    void getSystemMetricsReturnsPartialDtoWithNullStatsWhenExecutionServiceThrows() {
        when(executionService.getStats()).thenThrow(new RuntimeException("db error"));
        Gauge.builder("process.cpu.usage", () -> 0.75).register(meterRegistry);

        SystemMetricsDTO dto = widgetService.getSystemMetrics();

        // exception is swallowed — execution-stat fields remain null
        assertThat(dto.getTotalExecs()).isNull();
        assertThat(dto.getTotalFailedExecs()).isNull();
        assertThat(dto.getTotalRuntime()).isNull();
        assertThat(dto.getAverageRuntimeS()).isNull();
        // independent metrics are unaffected by the execution-service failure
        assertThat(dto.getCpuUsage()).isEqualTo(75.0);
    }
}

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.repository.ExecutionRepository;
import com.becon.opencelium.backend.database.mysql.repository.projection.DailyExecutionStatsProjection;
import com.becon.opencelium.backend.database.mysql.repository.projection.TopWorkflowProjection;
import com.becon.opencelium.backend.resource.application.ExecutionsTimelineDTO;
import com.becon.opencelium.backend.resource.application.TopWorkflowsDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class WidgetDataServiceImp implements WidgetDataService {

    private final ExecutionRepository executionRepository;

    public WidgetDataServiceImp(ExecutionRepository executionRepository) {
        this.executionRepository = executionRepository;
    }

    @Override
    public ExecutionsTimelineDTO getExecutionsTimeline(int days) {
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(days - 1L);

        Map<LocalDate, DailyExecutionStatsProjection> byDay = executionRepository
                .getDailyStatsSince(from.atStartOfDay())
                .stream()
                .collect(Collectors.toMap(
                        p -> p.getDay().toLocalDate(),
                        Function.identity()));

        List<ExecutionsTimelineDTO.Point> points = from.datesUntil(today.plusDays(1))
                .map(date -> {
                    DailyExecutionStatsProjection p = byDay.get(date);
                    long executions = p != null ? p.getExecutions() : 0L;
                    long failures = p != null ? p.getFailures() : 0L;
                    return new ExecutionsTimelineDTO.Point(date, date.getDayOfWeek(), executions, failures);
                })
                .toList();

        return new ExecutionsTimelineDTO(points);
    }

    @Override
    public TopWorkflowsDTO getTopWorkflows(int limit) {
        List<TopWorkflowsDTO.Row> rows = executionRepository.getTopWorkflows(limit).stream()
                .map(this::toRow)
                .toList();
        return new TopWorkflowsDTO(rows);
    }

    private TopWorkflowsDTO.Row toRow(TopWorkflowProjection p) {
        double rate = p.getFailureRate() != null ? p.getFailureRate() : 0.0;
        double rounded = Math.round(rate * 10.0) / 10.0;
        return new TopWorkflowsDTO.Row(p.getConnectionId(), p.getTitle(), p.getExecutions(), rounded);
    }
}

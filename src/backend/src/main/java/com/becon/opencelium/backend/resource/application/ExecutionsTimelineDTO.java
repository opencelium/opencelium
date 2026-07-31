package com.becon.opencelium.backend.resource.application;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Data for the "Executions & failures" widget: one point per day in the
 * requested window, zero-filled for days that had no executions.
 */
public record ExecutionsTimelineDTO(List<Point> points) {

    public record Point(
            LocalDate date,
            DayOfWeek dayOfWeek,
            long executions,
            long failures
    ) {}
}

package com.becon.opencelium.backend.resource.application;

import java.util.List;

/**
 * Data for the "Top workflows" widget: connections ranked by all-time
 * execution count, with their failure rate as a percentage.
 */
public record TopWorkflowsDTO(List<Row> rows) {

    public record Row(
            long connectionId,
            String title,
            long executions,
            double failureRate
    ) {}
}

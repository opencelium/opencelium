package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.resource.application.ExecutionsTimelineDTO;
import com.becon.opencelium.backend.resource.application.TopWorkflowsDTO;

public interface WidgetDataService {

    /**
     * "Executions & failures" widget: one point per day for the last {@code days}
     * days (inclusive of today), zero-filled for days without executions.
     */
    ExecutionsTimelineDTO getExecutionsTimeline(int days);

    /**
     * "Top workflows" widget: the {@code limit} connections with the most
     * executions of all time, with their failure rate.
     */
    TopWorkflowsDTO getTopWorkflows(int limit);
}

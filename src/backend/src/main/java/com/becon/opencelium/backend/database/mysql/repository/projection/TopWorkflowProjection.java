package com.becon.opencelium.backend.database.mysql.repository.projection;

public interface TopWorkflowProjection {
    Long getConnectionId();
    String getTitle();
    Long getExecutions();
    Double getFailureRate();
}

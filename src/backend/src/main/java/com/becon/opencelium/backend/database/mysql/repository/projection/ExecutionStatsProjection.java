package com.becon.opencelium.backend.database.mysql.repository.projection;

public interface ExecutionStatsProjection {
    Long getTotalExecs();
    Long getTotalFailed();
    Double getTotalRuntime();
    Double getAvgRuntime();
}

package com.becon.opencelium.backend.database.mysql.repository.projection;

import java.sql.Date;

public interface DailyExecutionStatsProjection {
    Date getDay();
    Long getExecutions();
    Long getFailures();
}

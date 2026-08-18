/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.Execution;
import com.becon.opencelium.backend.database.mysql.repository.projection.DailyExecutionStatsProjection;
import com.becon.opencelium.backend.database.mysql.repository.projection.ExecutionStatsProjection;
import com.becon.opencelium.backend.database.mysql.repository.projection.TopWorkflowProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, Long> {

    @Query(nativeQuery = true, value = """
            SELECT COUNT(*) AS totalExecs,
                COALESCE(SUM(CASE WHEN status = 'F' THEN 1 ELSE 0 END), 0) AS totalFailed,
                COALESCE(SUM(CASE WHEN start_time IS NOT NULL AND end_time IS NOT NULL
                    THEN TIMESTAMPDIFF(MICROSECOND, start_time, end_time) / 1000.0 ELSE 0 END), 0) AS totalRuntime,
                COALESCE(AVG(CASE WHEN status = 'S' AND start_time IS NOT NULL AND end_time IS NOT NULL
                    THEN TIMESTAMPDIFF(MICROSECOND, start_time, end_time) / 1000.0 ELSE NULL END), 0) AS avgRuntime
            FROM execution
            """)
    ExecutionStatsProjection getAggregatedStats();

    // "Executions & failures" widget: per-day totals since the given instant.
    // Only days that had executions are returned; gaps are zero-filled in the service.
    @Query(nativeQuery = true, value = """
            SELECT DATE(start_time) AS day,
                COUNT(*) AS executions,
                COALESCE(SUM(CASE WHEN status = 'F' THEN 1 ELSE 0 END), 0) AS failures
            FROM execution
            WHERE start_time >= :since
            GROUP BY DATE(start_time)
            ORDER BY day
            """)
    List<DailyExecutionStatsProjection> getDailyStatsSince(@Param("since") LocalDateTime since);

    // "Top workflows" widget: all-time execution count and failure rate (%) per connection.
    @Query(nativeQuery = true, value = """
            SELECT c.id AS connectionId,
                c.title AS title,
                COUNT(e.id) AS executions,
                COALESCE(SUM(CASE WHEN e.status = 'F' THEN 1 ELSE 0 END), 0) * 100.0 / COUNT(e.id) AS failureRate
            FROM execution e
            JOIN scheduler s ON e.scheduler_id = s.id
            JOIN connection c ON s.connection_id = c.id
            GROUP BY c.id, c.title
            ORDER BY executions DESC
            LIMIT :limit
            """)
    List<TopWorkflowProjection> getTopWorkflows(@Param("limit") int limit);

    List<Execution> findByEndTimeIsNull();

//    @Transactional
//    Optional<Execution> findTopBySchedulerIdOrderDesc(int schedulerId);

    // Bulk delete: skips loading the (potentially huge) execution history into the
    // persistence context. execution_argument rows must be removed first (NO ACTION FK).
    @Modifying
    @Transactional
    @Query("DELETE FROM Execution e WHERE e.scheduler.id = :schedulerId")
    void deleteBySchedulerId(@Param("schedulerId") int schedulerId);

    @Transactional
    List<Execution> findBySchedulerId(int schedulerId);
}

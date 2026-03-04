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
import com.becon.opencelium.backend.database.mysql.repository.projection.ExecutionStatsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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

    List<Execution> findByEndTimeIsNull();

//    @Transactional
//    Optional<Execution> findTopBySchedulerIdOrderDesc(int schedulerId);

    @Transactional
    void deleteBySchedulerId(int schedulerId);

    @Transactional
    List<Execution> findBySchedulerId(int schedulerId);
}

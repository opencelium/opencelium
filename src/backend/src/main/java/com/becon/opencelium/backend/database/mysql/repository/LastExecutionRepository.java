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

import com.becon.opencelium.backend.database.mysql.entity.LastExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface LastExecutionRepository extends JpaRepository<LastExecution, Integer> {


    boolean existsBySchedulerId(int scheduler);

    Optional<LastExecution> findBySchedulerId(int schedulerId);

    @Transactional
    void deleteBySchedulerId(int schedulerId);

    /**
     * Sets {@code s_has_log} only while the given execution is still the scheduler's last success.
     * A bulk JPQL update is used rather than an entity save so that it neither overwrites a newer
     * execution that replaced this one nor the columns a concurrent execution is writing.
     */
    @Modifying
    @Transactional
    @Query("UPDATE LastExecution le SET le.successHasLog = true "
            + "WHERE le.scheduler.id = :schedulerId AND le.successExecutionId = :executionId")
    void markSuccessLogAvailable(
            @Param("schedulerId") int schedulerId, @Param("executionId") long executionId);

    /**
     * Sets {@code f_has_log} only while the given execution is still the scheduler's last failure.
     * See {@link #markSuccessLogAvailable} for why this is a bulk update.
     */
    @Modifying
    @Transactional
    @Query("UPDATE LastExecution le SET le.failHasLog = true "
            + "WHERE le.scheduler.id = :schedulerId AND le.failExecutionId = :executionId")
    void markFailLogAvailable(
            @Param("schedulerId") int schedulerId, @Param("executionId") long executionId);
}

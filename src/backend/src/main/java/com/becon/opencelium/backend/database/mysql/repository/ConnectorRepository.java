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

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectorRepository extends JpaRepository<Connector, Integer> {

    boolean existsByTitle(String title);

    Optional<Connector> findByTitle(String name);

    boolean existsByInvoker(String title);

    @Transactional
    void deleteByInvoker(String invokerName);

    List<Connector> findAllByTitleContains(String title);

    List<Connector> findAllByInvoker(String invokerName);

    /**
     * Updates only the health-status columns. A bulk JPQL update bypasses entity lifecycle
     * callbacks, so the audit columns ({@code modified_by}/{@code modified_at}) are not
     * overwritten by the background health monitor.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Connector c SET c.status = :status, c.lastTestError = :error WHERE c.id = :id")
    void updateStatus(
            @Param("id") int id, @Param("status") ConnectorStatus status, @Param("error") String error);

    /**
     * Updates only {@code last_checked_at}. See {@link #updateStatus} for why this is a bulk
     * update rather than an entity save.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Connector c SET c.lastCheckedAt = :checkedAt WHERE c.id = :id")
    void updateLastCheckedAt(@Param("id") int id, @Param("checkedAt") Date checkedAt);

    /**
     * Stamps the audit columns without touching the rest of the row. Used when a user edit
     * changes only child rows (e.g. request data), which leaves the connector entity clean and
     * would otherwise not move {@code modified_by}/{@code modified_at}.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Connector c SET c.modifiedBy = :userId, c.modifiedAt = :modifiedAt WHERE c.id = :id")
    void touchAudit(
            @Param("id") int id, @Param("userId") Integer userId, @Param("modifiedAt") Date modifiedAt);
}

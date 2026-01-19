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

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedList;
import java.util.List;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    boolean existsByTitle(String title);

    @Query(value = "select * from connection where from_connector = ?1 or to_connector = ?1", nativeQuery = true)
    LinkedList<Connection> findAllByConnectorId(int connectorId);

    List<Connection> findAllByTitleContains(String title);
    List<Connection> findAllByIdNotIn(List<Long> ids);

    List<Connection> findAllByCategoryId(Integer categoryId);

    @Query("SELECT c.id FROM Connection c")
    List<Long> findIds();

    @Transactional
    @Modifying
    @Query("update Connection c set c.ocVersion = :version")
    void updateVersion(@Param("version")String version);

    @Query("select c.id from Connection c where c.title like :pattern")
    List<Long> findIdsByTitleLike(@Param("pattern") String pattern);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("delete from Connection c where c.id in :ids")
    int deleteByIds(@Param("ids") List<Long> ids);
}

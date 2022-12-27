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

package com.becon.opencelium.backend.neo4j.repository;

import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConnectionNodeRepository extends Neo4jRepository<ConnectionNode, Long> {
    @Query("MATCH (n)-[*0..]->(x) WHERE n.connectionId = {0} DETACH DELETE x")
    void deleteById(Long id);

    @Query("MATCH p=((:Connection{connectionId:{0}})-[*]->()) return p")
    Optional<ConnectionNode> findByConnectionId(Long connectionId);

    boolean existsByConnectionId(Long id);
}

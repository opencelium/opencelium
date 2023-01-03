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

import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MethodNodeRepository extends Neo4jRepository<MethodNode, Long> {

    @Query("MATCH p=((f:Field)<-[:has_field*0..10]-(:Body)<-[*]-()<-[:has_request|:has_response]-(:Method)) WHERE ID(f) = {0} RETURN p")
    Optional<MethodNode> findByFieldNodeId(Long fieldNodeId);

//    @Query("match (m:Method)-[:has_response|:has_request]->()-[*]->() where ID(m)={0} return m;")
//    Optional<MethodNode> findById(Long id);

    @Query("MATCH (:Connection{connectionId:{0}})-[:to_connector]->(:Connector{connectorId:{1}})-[*]->(m:Method) " +
            "optional match p=((m)-[:has_request|:has_response]->()-[*0..]->()) RETURN p")
    List<MethodNode> findToMethodsByConnectionIdAndConnectorId(Long connectionId, Integer connectorId);

    @Query("MATCH (:Connection{connectionId:{0}})-[:from_connector]->(:Connector{connectorId:{1}})-[*]->(m:Method) " +
            "optional match p=((m)-[:has_request|:has_response]->()-[*0..]->()) RETURN p")
    List<MethodNode> findFromMethodsByConnectionIdAndConnectorId(Long connectionId, Integer connectorId);

    @Query("match (c:Connection{connectionId:{0}})-[*]->(m:Method{color:{1}}) return ID(m)")
    Optional<Long> findIdByConnectionIdAndColor(Long connectionId, String color);
}

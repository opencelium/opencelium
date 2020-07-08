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

import com.becon.opencelium.backend.neo4j.entity.OperatorNode;
import org.springframework.data.neo4j.annotation.Query;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperatorNodeRepository extends Neo4jRepository<OperatorNode, Long> {

    @Query("MATCH (:Connection{connectionId:{0}})-[:from_connector]->(c:Connector{connectorId:{1}})-[*]->(m:Operator) " +
           "MATCH p=((m)-[:left|:right]->(:Statement)) RETURN p")
    List<OperatorNode> findFromOperatorByConnectionIdAndConnectorId(Long connectionId, Integer connectorId);

    @Query("MATCH (:Connection{connectionId:{0}})-[:to_connector]->(c:Connector{connectorId:{1}})-[*]->(m:Operator) " +
            "MATCH p=((m)-[:left|:right]->(:Statement)) RETURN p")
    List<OperatorNode> findToOperatorByConnectionIdAndConnectorId(Long connectionId, Integer connectorId);
}

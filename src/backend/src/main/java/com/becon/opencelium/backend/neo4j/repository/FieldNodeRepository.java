/*
 * // Copyright (C) <2019> <becon GmbH>
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

import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import com.becon.opencelium.backend.neo4j.entity.RequestNode;
import com.becon.opencelium.backend.neo4j.entity.ResultNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.neo4j.annotation.Query;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FieldNodeRepository extends Neo4jRepository<FieldNode, Long> {

    @Query("match (conn:Connection{connectionId:{0}})-[*]->(f:Method{color:{1}})-[:has_response]->" +
            "(:Response)-[:has_success|has_fail]->(:Result{name:{2}})-[has_body]->" +
            "(:Body)-[:has_field*1..6]->(fi:Field{name:{3}}) return fi;")
    FieldNode findFirstFieldInResponse(Long connectionId, String function, String result, String field);

    @Query("match (conn:Connection{connectionId:{0}})-[*]->(f:Method{color:{1}})-[:has_request]->" +
            "(:Request)-[has_body]->(:Body)-[:has_field*1..6]->(fi:Field{name:{2}}) return fi;")
    FieldNode findFirstFieldInRequest(Long connectionId, String function, String field);

    @Query("match (f1:Field)-[:has_field]->(f2:Field{name:{0}}) where ID(f1)={1} return f2;")
    FieldNode findNextField(String fieldName, Long pervFieldId);

    @Query("MATCH (f:Field)<-[:has_field*0..10]-(:Body)<-[*]-(s:Result) WHERE ID(f) = {0} RETURN s")
    ResultNode fieldHasSuccess(Long fieldId);

    @Query("MATCH (f:Field)<-[:has_field*0..10]-(:Body)<-[*]-(req:Request) WHERE ID(f) = {0} RETURN req")
    RequestNode fieldHasRequest(Long fieldId);

    @Query("match (enh:Enhancement)-[:linked]->(f:Field) where ID(f) = {0} return enh")
    Optional<EnhancementNode> hasEnhancement(Long fieldId);

    @Query("match (f:Field)-[:linked]->(enh:Enhancement)-[:linked]->(t:Field) where ID(t)={0} return f;")
    List<FieldNode> findIncoming(Long fieldId);

    @Query("MATCH (f:Field)<-[:has_field*0..10]-(:Body)<-[*]-()<-[:has_request|:has_response]-(:Method)<-[*]-(conn:Connector) WHERE ID(f)={0} RETURN conn.name")
    String findInvoker(Long fieldId);
}

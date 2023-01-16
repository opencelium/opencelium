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

import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import com.becon.opencelium.backend.neo4j.entity.RequestNode;
import com.becon.opencelium.backend.neo4j.entity.ResultNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FieldNodeRepository extends Neo4jRepository<FieldNode, Long> {

    @Query("match (conn:Connection{connectionId:$connectionId})-[*]->(f:Method{color:$function})-[:has_response]->" +
            "(:Response)-[:has_success|has_fail]->(:Result{name:$result})-[has_body]->" +
            "(:Body)-[:has_field]->(fi:Field{name:$field}) return fi;")
    FieldNode findFirstFieldInResponse(Long connectionId, String function, String result, String field);

    @Query("match (conn:Connection{connectionId:$connectionId})-[*]->(f:Method{color:$function})-[:has_request]->" +
            "(:Request)-[has_body]->(:Body)-[:has_field]->(fi:Field{name:$field}) return fi;")
    FieldNode findFirstFieldInRequest(Long connectionId, String function, String field);

    @Query("match (f1:Field)-[:has_field]->(f2:Field{name:$fieldName}) where ID(f1)=$pervFieldId return f2;")
    FieldNode findNextField(String fieldName, Long pervFieldId);

    @Query("MATCH (f:Field)<-[:has_field*0..10]-(:Body)<-[*]-(s:Result) WHERE ID(f) = $fieldId RETURN s")
    ResultNode fieldHasSuccess(Long fieldId);

    @Query("MATCH (f:Field)<-[:has_field*0..10]-(:Body)<-[*]-(req:Request) WHERE ID(f) = $fieldId RETURN req")
    RequestNode fieldHasRequest(Long fieldId);

    @Query("match (enh:Enhancement)-[:linked]->(f:Field) where ID(f) = $fieldId return enh")
    Optional<EnhancementNode> hasEnhancement(Long fieldId);

    @Query("match (f:Field)-[:linked]->(enh:Enhancement)-[:linked]->(t:Field) where ID(t)=$fieldId return f;")
    List<FieldNode> findIncoming(Long fieldId);

    @Query("MATCH (f:Field)<-[:has_field*0..10]-(:Body)<-[*]-()<-[:has_request|:has_response]-(:Method)<-[*]-(conn:Connector) WHERE ID(f)=$fieldId" +
            " RETURN conn.name")
    String findInvoker(Long fieldId);
}

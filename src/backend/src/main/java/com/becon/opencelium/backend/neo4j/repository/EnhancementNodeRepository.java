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
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnhancementNodeRepository extends Neo4jRepository<EnhancementNode, Long> {

    Optional<EnhancementNode> findOptionalByEnhanceId(Integer enhanceId);

    @Query("match (enh:Enhancement)-[:linked]->(f:Field) where ID(f) = $fieldId return enh")
    Optional<EnhancementNode> findByFieldId(Long fieldId);

    @Query("match (enh:Enhancement)-[:linked]->(f:Field) where ID(f) = $connectionId return enh")
    LinkedList<EnhancementNode> findAllByConnectionId(Long connectionId);

    @Query("match (f:Field)-[:linked]-(enh:Enhancement) where ID(f) = $fieldId return enh")
    Optional<EnhancementNode> fieldHasEnhancement(Long fieldId);
}

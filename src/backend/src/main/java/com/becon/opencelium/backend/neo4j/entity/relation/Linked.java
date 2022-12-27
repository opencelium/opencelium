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

package com.becon.opencelium.backend.neo4j.entity.relation;

import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

@RelationshipProperties()
public class Linked {

    @Id
    @GeneratedValue
    private Long id;

    private FieldNode fieldNodeStart;

    @TargetNode
    private FieldNode fieldNodeEnd;

    public Linked() {

    }

    public Linked(FieldNode fieldNodeStart, FieldNode fieldNodeEnd) {

        this.fieldNodeStart = fieldNodeStart;
        this.fieldNodeEnd = fieldNodeEnd;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public FieldNode getFieldNodeStart() {
        return fieldNodeStart;
    }

    public void setFieldNodeStart(FieldNode fieldNodeStart) {
        this.fieldNodeStart = fieldNodeStart;
    }

    public FieldNode getFieldNodeEnd() {
        return fieldNodeEnd;
    }

    public void setFieldNodeEnd(FieldNode fieldNodeEnd) {
        this.fieldNodeEnd = fieldNodeEnd;
    }
}

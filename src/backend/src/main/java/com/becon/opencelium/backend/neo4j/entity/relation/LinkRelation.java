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

package com.becon.opencelium.backend.neo4j.entity.relation;

import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import org.neo4j.ogm.annotation.*;

@RelationshipEntity(type = "linked")
public class LinkRelation {

    @Id
    @GeneratedValue
    private Long id;

    @StartNode
    private FieldNode fieldNodeStart;

    @EndNode
    private FieldNode fieldNodeEnd;

    public LinkRelation() {

    }

    public LinkRelation(FieldNode fieldNodeStart, FieldNode fieldNodeEnd) {

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

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

package com.becon.opencelium.backend.neo4j.entity;

import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.List;

@Node("Field")
public class FieldNode {

    @Id
    @GeneratedValue
    private Long id;

    private String name;
    private String value;
    private String type;

    @Relationship(type = "has_field", direction = Relationship.Direction.OUTGOING)
    private List<FieldNode> child;

    @Relationship(type = "has_attribute", direction = Relationship.Direction.OUTGOING)
    private List<AttributeNode> attribute;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<FieldNode> getChild() {
        return child;
    }

    public void setChild(List<FieldNode> child) {
        this.child = child;
    }

    public List<AttributeNode> getAttribute() {
        return attribute;
    }

    public void setAttribute(List<AttributeNode> attribute) {
        this.attribute = attribute;
    }
}

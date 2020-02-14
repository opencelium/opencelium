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

import org.neo4j.ogm.annotation.GeneratedValue;
import org.neo4j.ogm.annotation.Id;
import org.neo4j.ogm.annotation.NodeEntity;
import org.neo4j.ogm.annotation.Relationship;

@NodeEntity(label = "Method")
public class MethodNode {

    @Id
    @GeneratedValue
    private Long id;
    private String index;
    private String color;
    private String name;

    @Relationship(type = "has_request", direction = Relationship.OUTGOING)
    private RequestNode requestNode;

    @Relationship(type = "has_response", direction = Relationship.OUTGOING)
    private ResponseNode responseNode;

    @Relationship(type = "next_action", direction = Relationship.OUTGOING)
    private MethodNode nextFunction;

    @Relationship(type = "next_action", direction = Relationship.OUTGOING)
    private OperatorNode nextOperator;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIndex() {
        return index;
    }

    public void setIndex(String index) {
        this.index = index;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RequestNode getRequestNode() {
        return requestNode;
    }

    public void setRequestNode(RequestNode requestNode) {
        this.requestNode = requestNode;
    }

    public ResponseNode getResponseNode() {
        return responseNode;
    }

    public void setResponseNode(ResponseNode responseNode) {
        this.responseNode = responseNode;
    }

    public MethodNode getNextFunction() {
        return nextFunction;
    }

    public void setNextFunction(MethodNode nextFunction) {
        this.nextFunction = nextFunction;
    }

    public OperatorNode getNextOperator() {
        return nextOperator;
    }

    public void setNextOperator(OperatorNode nextOperator) {
        this.nextOperator = nextOperator;
    }
}

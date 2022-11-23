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

@NodeEntity(label = "Statement")
public class StatementNode {
    @Id
    @GeneratedValue
    private Long id;

    private String index;
    private String type; // response or request type
    private String iterator;
    private String operand;

    @Relationship(type = "left", direction = Relationship.OUTGOING)
    private StatementVariable leftStatementVariable;

    @Relationship(type = "right", direction = Relationship.OUTGOING)
    private StatementVariable rightStatementVariable;

    @Relationship(type = "next_action", direction = Relationship.OUTGOING)
    private MethodNode nextFunction;

    @Relationship(type = "next_action", direction = Relationship.OUTGOING)
    private StatementNode nextOperator;

    @Relationship(type = "body_action", direction = Relationship.OUTGOING)
    private MethodNode bodyFunction;

    @Relationship(type = "body_action", direction = Relationship.OUTGOING)
    private StatementNode bodyOperator;

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public StatementVariable getLeftStatementVariable() {
        return leftStatementVariable;
    }

    public void setLeftStatementVariable(StatementVariable leftStatementVariable) {
        this.leftStatementVariable = leftStatementVariable;
    }

    public StatementVariable getRightStatementVariable() {
        return rightStatementVariable;
    }

    public void setRightStatementVariable(StatementVariable rightStatementVariable) {
        this.rightStatementVariable = rightStatementVariable;
    }

    public String getOperand() {
        return operand;
    }

    public void setOperand(String operand) {
        this.operand = operand;
    }

    public MethodNode getNextFunction() {
        return nextFunction;
    }

    public void setNextFunction(MethodNode nextFunction) {
        this.nextFunction = nextFunction;
    }

    public StatementNode getNextOperator() {
        return nextOperator;
    }

    public void setNextOperator(StatementNode nextOperator) {
        this.nextOperator = nextOperator;
    }

    public MethodNode getBodyFunction() {
        return bodyFunction;
    }

    public void setBodyFunction(MethodNode bodyFunction) {
        this.bodyFunction = bodyFunction;
    }

    public StatementNode getBodyOperator() {
        return bodyOperator;
    }

    public void setBodyOperator(StatementNode bodyOperator) {
        this.bodyOperator = bodyOperator;
    }

    public String getIterator() {
        return iterator;
    }

    public void setIterator(String iterator) {
        this.iterator = iterator;
    }
}

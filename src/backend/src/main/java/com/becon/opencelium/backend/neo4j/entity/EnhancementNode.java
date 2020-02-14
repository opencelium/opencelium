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

import java.util.List;

@NodeEntity(label = "Enhancement")
public class EnhancementNode {

    @Id
    @GeneratedValue
    private Long id;

    private Integer enhanceId; // TODO: need to change in db from int to bigint
    private String name;


    @Relationship(type = "linked", direction = Relationship.INCOMING)
    private List<FieldNode> incomeField;

    @Relationship(type = "linked", direction = Relationship.OUTGOING)
    private List<FieldNode> outgoingField;

    public EnhancementNode() {

    }

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

    public Integer getEnhanceId() {
        return enhanceId;
    }

    public void setEnhanceId(Integer enhanceId) {
        this.enhanceId = enhanceId;
    }

    public List<FieldNode> getIncomeField() {
        return incomeField;
    }

    public void setIncomeField(List<FieldNode> incomeField) {
        this.incomeField = incomeField;
    }

    public List<FieldNode> getOutgoingField() {
        return outgoingField;
    }

    public void setOutgoingField(List<FieldNode> outgoingField) {
        this.outgoingField = outgoingField;
    }
}

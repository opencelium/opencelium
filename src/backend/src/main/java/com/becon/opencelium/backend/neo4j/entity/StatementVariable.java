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

import com.becon.opencelium.backend.resource.connection.StatementResource;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Variable")
public class StatementVariable {

    @Id
    @GeneratedValue
    private Long id;

    private String color;
    private String type;
    private String filed;// if like then -> {}
    private String rightPropertyValue;

    public StatementVariable() {
    }

    public StatementVariable(StatementResource resource) {
        this.color = resource.getColor();
        this.type = resource.getType();
        this.filed = resource.getField();
        this.rightPropertyValue = resource.getRightPropertyValue();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFiled() {
        return filed;
    }

    public void setFiled(String filed) {
        this.filed = filed;
    }

    public String getRightPropertyValue() {
        return rightPropertyValue;
    }

    public void setRightPropertyValue(String rightPropertyValue) {
        this.rightPropertyValue = rightPropertyValue;
    }
}

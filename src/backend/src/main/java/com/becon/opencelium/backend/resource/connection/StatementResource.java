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

package com.becon.opencelium.backend.resource.connection;

import com.becon.opencelium.backend.neo4j.entity.StatementVariable;
import org.springframework.hateoas.RepresentationModel;

import javax.annotation.Resource;

@Resource
public class StatementResource extends RepresentationModel {

    private String color;
    private String field;
    private String type;
    private String rightPropertyValue;

    public StatementResource() {
    }

    public StatementResource(StatementVariable statementVariable) {
        this.color = statementVariable.getColor();
        this.field = statementVariable.getFiled();
        this.type = statementVariable.getType();
        this.rightPropertyValue = statementVariable.getRightPropertyValue();
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRightPropertyValue() {
        return rightPropertyValue;
    }

    public void setRightPropertyValue(String rightPropertyValue) {
        this.rightPropertyValue = rightPropertyValue;
    }
}

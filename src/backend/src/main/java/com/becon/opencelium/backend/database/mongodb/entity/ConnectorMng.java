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

package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.List;

public class ConnectorMng {

//    @MongoId(targetType = FieldType.OBJECT_ID)
//    private String id;
    @Field(name = "connector_id")
    private Integer connectorId;
    private String title;
    @DBRef
    private List<MethodMng> methods;
    @DBRef
    private List<OperatorMng> operators;

    public ConnectorMng() {
    }

//    public String getId() {
//        return id;
//    }
//
//    public void setId(String id) {
//        this.id = id;
//    }

    public Integer getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(Integer connectorId) {
        this.connectorId = connectorId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<MethodMng> getMethods() {
        return methods;
    }

    public void setMethods(List<MethodMng> methods) {
        this.methods = methods;
    }

    public List<OperatorMng> getOperators() {
        return operators;
    }

    public void setOperators(List<OperatorMng> operators) {
        this.operators = operators;
    }
}

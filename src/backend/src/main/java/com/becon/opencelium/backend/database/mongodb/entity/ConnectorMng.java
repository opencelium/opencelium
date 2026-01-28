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

import jakarta.validation.constraints.NotNull;
import org.checkerframework.checker.units.qual.N;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

public class ConnectorMng {
    @NotNull
    @Field(name = "connector_id")
    private Integer connectorId;

    @NotNull
    @Field(name = "flowId")
    private String flowId;

    private String title;

    @DBRef
    @Field("methods")
    private List<MethodMng> oldMethods;

    @Field("method")
    private List<MethodMng> methods;

    @DBRef
    @Field("operators")
    private List<OperatorMng> oldOperators;

    @Field("operator")
    private List<OperatorMng> operators;

    public ConnectorMng() {
    }

    public Integer getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(Integer connectorId) {
        this.connectorId = connectorId;
    }

    public String getFlowId() {
        return flowId;
    }

    public void setFlowId(String flowId) {
        this.flowId = flowId;
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

    public List<MethodMng> getOldMethods() {
        return oldMethods;
    }

    public List<OperatorMng> getOldOperators() {
        return oldOperators;
    }

    public void setOldOperators(List<OperatorMng> oldOperators) {
        this.oldOperators = oldOperators;
    }

    public void setOldMethods(List<MethodMng> oldMethods) {
        this.oldMethods = oldMethods;
    }
}

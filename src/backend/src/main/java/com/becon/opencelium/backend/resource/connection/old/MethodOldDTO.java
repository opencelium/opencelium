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

package com.becon.opencelium.backend.resource.connection.old;

import com.becon.opencelium.backend.enums.MethodType;
import com.becon.opencelium.backend.resource.connection.MethodConnectorDTO;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import com.becon.opencelium.backend.resource.connector.ResponseDTO;
import jakarta.annotation.Resource;

@Resource
public class MethodOldDTO {

    private String nodeId;
    private String index;
    private String name;
    private String color;
    private String label;
    private MethodType methodType;
    private Integer dataAggregator;
    /**
     * optional field
     */
    private String jump;
    private RequestDTO request;
    private ResponseDTO response;
    private MethodConnectorDTO connector;

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public String getIndex() {
        return index;
    }

    public void setIndex(String index) {
        this.index = index;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public MethodType getMethodType() {
        return methodType;
    }

    public void setMethodType(MethodType methodType) {
        this.methodType = methodType;
    }

    public RequestDTO getRequest() {
        return request;
    }

    public void setRequest(RequestDTO request) {
        this.request = request;
    }

    public ResponseDTO getResponse() {
        return response;
    }

    public void setResponse(ResponseDTO response) {
        this.response = response;
    }

    public Integer getDataAggregator() {
        return dataAggregator;
    }

    public void setDataAggregator(Integer dataAggregator) {
        this.dataAggregator = dataAggregator;
    }

    @Override
    public boolean equals(Object obj) {
        return this == obj;
    }

    public MethodConnectorDTO getConnector() {
        return connector;
    }

    public void setConnector(MethodConnectorDTO connector) {
        this.connector = connector;
    }

    public String getJump() {
        return jump;
    }

    public void setJump(String jump) {
        this.jump = jump;
    }
}

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

import com.becon.opencelium.backend.resource.connector.RequestDTO;
import com.becon.opencelium.backend.resource.connector.ResponseDTO;
import jakarta.annotation.Resource;

@Resource
public class MethodDTO {

    private String id;
    private String index;
    private String name;
    private String color;
    private String label;
    private Integer dataAggregator;
    private RequestDTO request;
    private ResponseDTO response;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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
}

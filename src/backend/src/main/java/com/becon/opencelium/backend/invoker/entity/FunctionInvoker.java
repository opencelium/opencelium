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

package com.becon.opencelium.backend.invoker.entity;

import com.becon.opencelium.backend.resource.connector.FunctionDTO;

public class FunctionInvoker {
    private String name;
    private String type;
    private RequestInv request;
    private ResponseInv response;

    public FunctionInvoker() {
    }

    public FunctionInvoker(FunctionDTO functionDTO) {
        this.name = functionDTO.getName();
        this.type = functionDTO.getType();
        this.request = new RequestInv(functionDTO.getRequest());
        this.response = new ResponseInv(functionDTO.getResponse());
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public RequestInv getRequest() {
        return request;
    }

    public void setRequest(RequestInv request) {
        this.request = request;
    }

    public ResponseInv getResponse() {
        return response;
    }

    public void setResponse(ResponseInv response) {
        this.response = response;
    }
}

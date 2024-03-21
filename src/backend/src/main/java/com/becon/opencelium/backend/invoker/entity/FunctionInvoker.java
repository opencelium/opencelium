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

import com.becon.opencelium.backend.invoker.paginator.entity.Pagination;
import com.becon.opencelium.backend.resource.connector.FunctionResource;

public class FunctionInvoker {
    private String name;
    private String type;
    private Pagination pagination;
    private RequestInv request;
    private ResponseInv response;

    public FunctionInvoker() {
    }

    public FunctionInvoker(FunctionResource functionResource) {
        this.name = functionResource.getName();
        this.type = functionResource.getType();
        this.request = new RequestInv(functionResource.getRequest());
        this.response = new ResponseInv(functionResource.getResponse());
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

    public Pagination getPagination() {
        return pagination;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
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

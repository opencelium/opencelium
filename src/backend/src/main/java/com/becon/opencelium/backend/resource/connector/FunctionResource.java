/*
 * // Copyright (C) <2019> <becon GmbH>
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

package com.becon.opencelium.backend.resource.connector;

import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import org.springframework.hateoas.ResourceSupport;

import javax.annotation.Resource;

@Resource
public class FunctionResource extends ResourceSupport {

    private String name;
    private String type;
    private RequestResource request;
    private ResponseResource response;

    public FunctionResource() {
    }

    public FunctionResource(FunctionInvoker functionInvoker) {
        this.name = functionInvoker.getName();
        this.type = functionInvoker.getType();
        this.request =  new RequestResource(functionInvoker.getRequest());
        this.response = new ResponseResource(functionInvoker.getResponse());
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

    public RequestResource getRequest() {
        return request;
    }

    public void setRequest(RequestResource request) {
        this.request = request;
    }

    public ResponseResource getResponse() {
        return response;
    }

    public void setResponse(ResponseResource response) {
        this.response = response;
    }
}

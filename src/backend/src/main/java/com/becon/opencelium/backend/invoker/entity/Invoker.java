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

import com.becon.opencelium.backend.invoker.service.OperationService;
import com.becon.opencelium.backend.invoker.service.OperationServiceImp;
import com.becon.opencelium.backend.resource.connector.InvokerResource;

import java.util.List;

public class Invoker {
    private String name;
    private String description;
    private String hint;
    private String icon;
    private String authType;
    private List<RequiredData> requiredData;
    private List<FunctionInvoker> operations;

    public Invoker() {
    }

//    public Invoker(InvokerResource invokerResource) {
////        this.name = invokerResource.getName();
////        this.description = invokerResource.getDescription();
////        this.hint = invokerResource.getHint();
////        this.icon = invokerResource.getIcon();
////        this.authType = invokerResource.getAuthType();
////        this.requestData = invokerResource.getRequestData().stream().map(data -> new RequestData(data)).collect(Collectors.toList());
////        this.operations = invokerResource.getOperations().stream().map(FunctionInvoker::new).collect(Collectors.toList());
//    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getHint() {
        return hint;
    }

    public void setHint(String hint) {
        this.hint = hint;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getAuthType() {
        return authType;
    }

    public void setAuthType(String authType) {
        this.authType = authType;
    }

    public List<RequiredData> getRequiredData() {
        return requiredData;
    }

    public void setRequiredData(List<RequiredData> requiredData) {
        this.requiredData = requiredData;
    }

    public List<FunctionInvoker> getOperations() {
        return operations;
    }

    public void setOperations(List<FunctionInvoker> operations) {
        this.operations = operations;
    }

}

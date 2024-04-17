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

import com.becon.opencelium.backend.database.mysql.entity.BusinessLayout;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;

import java.util.List;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConnectorOldDTO {

    private Integer connectorId;
    private String title;
    private String icon;
    private boolean sslCert;
    private int timeout;
    private InvokerDTO invoker; // due to front end asked sending object, normally should be name of invoker
    private List<MethodOldDTO> methods;
    private List<OperatorOldDTO> operators;
    private BusinessLayout businessLayout;

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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public InvokerDTO getInvoker() {
        return invoker;
    }

    public void setInvoker(InvokerDTO invoker) {
        this.invoker = invoker;
    }

    public boolean isSslCert() {
        return sslCert;
    }

    public void setSslCert(boolean sslCert) {
        this.sslCert = sslCert;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public BusinessLayout getBusinessLayout() {
        return businessLayout;
    }

    public void setBusinessLayout(BusinessLayout businessLayout) {
        this.businessLayout = businessLayout;
    }

    public List<MethodOldDTO> getMethods() {
        return methods;
    }

    public void setMethods(List<MethodOldDTO> methods) {
        this.methods = methods;
    }

    public List<OperatorOldDTO> getOperators() {
        return operators;
    }

    public void setOperators(List<OperatorOldDTO> operators) {
        this.operators = operators;
    }
}

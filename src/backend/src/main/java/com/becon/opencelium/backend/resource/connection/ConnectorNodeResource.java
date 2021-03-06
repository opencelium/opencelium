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

import com.becon.opencelium.backend.mysql.entity.BusinessLayout;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.hateoas.ResourceSupport;

import javax.annotation.Resource;
import java.util.List;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConnectorNodeResource extends ResourceSupport {

    private Long nodeId;
    private Integer connectorId;
    private String title;
    private String icon;
    private boolean sslCert;
    private int timeout;
    private InvokerResource invoker; // due to front end asked sending object, normally should be name of invoker
    private BusinessLayout businessLayout;
    private List<MethodResource> methods;
    private List<OperatorResource> operators;

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

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

    public InvokerResource getInvoker() {
        return invoker;
    }

    public void setInvoker(InvokerResource invoker) {
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

    public List<MethodResource> getMethods() {
        return methods;
    }

    public void setMethods(List<MethodResource> methods) {
        this.methods = methods;
    }

    public List<OperatorResource> getOperators() {
        return operators;
    }

    public void setOperators(List<OperatorResource> operators) {
        this.operators = operators;
    }
}

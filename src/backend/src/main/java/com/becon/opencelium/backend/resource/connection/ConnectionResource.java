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
import com.becon.opencelium.backend.resource.blayout.BusinessLayoutResource;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingResource;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.hateoas.RepresentationModel;

import javax.annotation.Resource;
import java.util.List;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConnectionResource extends RepresentationModel {

    private Long nodeId;
    private Long connectionId;
    private String title;
    private String description;
    private ConnectorNodeResource fromConnector;
    private ConnectorNodeResource toConnector;
    private List<FieldBindingResource> fieldBinding;
    private BusinessLayoutResource businessLayout;

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ConnectorNodeResource getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(ConnectorNodeResource fromConnector) {
        this.fromConnector = fromConnector;
    }

    public ConnectorNodeResource getToConnector() {
        return toConnector;
    }

    public void setToConnector(ConnectorNodeResource toConnector) {
        this.toConnector = toConnector;
    }

    public List<FieldBindingResource> getFieldBinding() {
        return fieldBinding;
    }

    public void setFieldBinding(List<FieldBindingResource> fieldBinding) {
        this.fieldBinding = fieldBinding;
    }

    public BusinessLayoutResource getBusinessLayout() {
        return businessLayout;
    }

    public void setBusinessLayout(BusinessLayoutResource businessLayout) {
        this.businessLayout = businessLayout;
    }
}

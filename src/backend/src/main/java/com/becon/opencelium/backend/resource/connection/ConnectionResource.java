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

import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;

import java.util.List;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConnectionResource {
    private Long id;
    private String title;
    private String description;
    private String icon;
    private ConnectorResource fromConnector;
    private ConnectorResource toConnector;
    private List<EnhancementDTO> enhancements;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public ConnectorResource getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(ConnectorResource fromConnector) {
        this.fromConnector = fromConnector;
    }

    public ConnectorResource getToConnector() {
        return toConnector;
    }

    public void setToConnector(ConnectorResource toConnector) {
        this.toConnector = toConnector;
    }

    public List<EnhancementDTO> getEnhancements() {
        return enhancements;
    }

    public void setEnhancements(List<EnhancementDTO> enhancements) {
        this.enhancements = enhancements;
    }
}

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

package com.becon.opencelium.backend.resource.user;

import com.becon.opencelium.backend.mysql.entity.Component;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.hateoas.RepresentationModel;

import javax.annotation.Resource;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ComponentResource extends RepresentationModel {

    private int componentId;// TODO: perhaps need to change from componentId to id;
    private String name;
    private Set<String> permissions;

    public ComponentResource() {
    }

    public ComponentResource(Component component) {
        this.componentId = component.getId();
        this.name = component.getName();
    }

    public ComponentResource(Component component, int userRoleId) {
        this.componentId = component.getId();
        this.name = component.getName();
        this.permissions = component.getPermissions()
                .stream()
                .filter(c -> c.getUserRole().getId() == userRoleId)
                .map(p -> p.getPermission().getName()).collect(Collectors.toSet());
    }

    public int getComponentId() {
        return componentId;
    }

    public void setComponentId(int componentId) {
        this.componentId = componentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<String> permissions) {
        this.permissions = permissions;
    }
}

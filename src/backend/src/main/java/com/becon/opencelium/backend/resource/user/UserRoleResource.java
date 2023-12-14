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

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import jakarta.annotation.Resource;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Resource
public class UserRoleResource {

    private int groupId;
    private String name; //TODO: change from role to name
    private String description;
    private String icon;
    private List<ComponentResource> components = new ArrayList<>();

//    private final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
//    private final String imagePath = new ServerUtility().getUri();
    private final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
    private final String imagePath = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;

    public UserRoleResource(UserRole userRole) {
        this.groupId = userRole.getId();
        this.name = userRole.getName();
        this.description = userRole.getDescription();
        if (userRole.getIcon() != null){
            this.icon = "imagePath" + userRole.getIcon();
        }
        this.components = userRole.getComponents().stream()
                .map(RoleHasPermission::getComponent)
                .collect(Collectors.toSet())
                .stream().map(component -> new ComponentResource(component, groupId))
                .collect(Collectors.toList());
    }

    public UserRoleResource(int groupId) {
        this.groupId = groupId;
    }

    public UserRoleResource() {
    }

    public int getGroupId() {
        return groupId;
    }

    public void setGroupId(int groupId) {
        this.groupId = groupId;
    }

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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public List<ComponentResource> getComponents() {
        return components;
    }

    public void setComponents(List<ComponentResource> components) {
        this.components = components;
    }
}

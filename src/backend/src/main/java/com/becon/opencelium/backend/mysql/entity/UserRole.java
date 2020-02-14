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

package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.user.UserRoleResource;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "role")
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "icon")
    private String icon;

    @OneToOne(mappedBy = "userRole", fetch = FetchType.EAGER)
    private User user;

    @OneToMany(mappedBy = "userRole", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<RoleHasPermission> components = new HashSet<RoleHasPermission>();

    public UserRole() {
    }

    public UserRole(UserRoleResource userRoleResource) {
        this.id = userRoleResource.getGroupId();
        this.name = userRoleResource.getName();
        this.description = userRoleResource.getDescription();
        this.icon = userRoleResource.getIcon();
        // TODO: need to finish component when client wants to convert from resource to entity
//        this.components = userRoleResource.getComponents()
//                .stream()
//                .map(c -> c.getPermissions().stream().map(p -> new RoleHasPermission(this.id, c.getComponentId(), p)));
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Set<RoleHasPermission> getComponents() {
        return components;
    }

    public void setComponents(Set<RoleHasPermission> components) {
        this.components = components;
    }
}

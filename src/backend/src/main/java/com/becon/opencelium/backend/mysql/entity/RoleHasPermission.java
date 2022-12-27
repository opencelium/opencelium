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

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "role_has_permission")
public class RoleHasPermission {

    @EmbeddedId
    private RoleHasPermissionId id;

    @ManyToOne
    @JoinColumn(name = "role_id", insertable = false, updatable = false)
    private UserRole userRole;

    @ManyToOne
    @JoinColumn(name="component_id", insertable = false, updatable = false)
    private Component component;

    @ManyToOne
    @JoinColumn(name="permission_id", insertable = false, updatable = false)
    private Permission permission;

    public RoleHasPermission(){

    }

    public RoleHasPermission(UserRole userRole, Component component, Permission permission) {
        // create primary key
        this.id = new RoleHasPermissionId(userRole.getId(), component.getId(), permission.getId());

        // initialize attributes
        this.userRole = userRole;
        this.component = component;
        this.permission = permission;

        // update relationships to assure referential integrity
        userRole.getComponents().add(this);
        component.getPermissions().add(this);
    }

    public RoleHasPermissionId getId() {
        return id;
    }

    public void setId(RoleHasPermissionId id) {
        this.id = id;
    }

    public UserRole getUserRole() {
        return userRole;
    }

    public void setUserRole(UserRole userRole) {
        this.userRole = userRole;
    }

    public Component getComponent() {
        return component;
    }

    public void setComponent(Component component) {
        this.component = component;
    }

    public Permission getPermission() {
        return permission;
    }

    public void setPermission(Permission permission) {
        this.permission = permission;
    }

    @Embeddable
    public static class RoleHasPermissionId implements Serializable {

        @Column(name = "role_id")
        protected Integer roleId;

        @Column(name = "component_id")
        protected Integer componentId;

        @Column(name = "permission_id")
        protected Integer permissionId;

        public RoleHasPermissionId() {

        }

        public RoleHasPermissionId(Integer roleId, Integer componentId, Integer permissionId) {
            this.roleId = roleId;
            this.componentId = componentId;
            this.permissionId = permissionId;
        }

        @Override
        public int hashCode() {
            final int prime = 31;
            int result = 1;
            result = prime * result
                    + ((roleId == null) ? 0 : roleId.hashCode());

            result = prime * result
                    + ((componentId == null) ? 0 : componentId.hashCode());

            result = prime * result
                    + ((permissionId == null) ? 0 : permissionId.hashCode());
            return result;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj)
                return true;
            if (obj == null)
                return false;
            if (getClass() != obj.getClass())
                return false;

            RoleHasPermissionId other = (RoleHasPermissionId) obj;

            if (roleId == null) {
                if (other.roleId != null)
                    return false;
            } else if (!roleId.equals(other.roleId))
                return false;

            if (componentId == null) {
                if (other.componentId != null)
                    return false;
            } else if (!componentId.equals(other.componentId))
                return false;

            if (permissionId == null) {
                if (other.permissionId != null)
                    return false;
            } else if (!permissionId.equals(other.permissionId))
                return false;

            return true;
        }
    }
}

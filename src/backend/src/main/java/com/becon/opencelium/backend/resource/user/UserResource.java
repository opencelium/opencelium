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

package com.becon.opencelium.backend.resource.user;

import com.becon.opencelium.backend.mysql.entity.User;
import org.springframework.hateoas.ResourceSupport;

import javax.annotation.Resource;

@Resource
public class UserResource  extends ResourceSupport {

    private int userId;
    private String email;
    private UserRoleResource userGroup; // TODO: should be  userRole
    private UserDetailResource userDetail;

    public UserResource() {
    }

    public UserResource(User user) {
        this.userId = user.getId();
        this.email = user.getEmail();
        this.userGroup = new UserRoleResource(user.getUserRole());
        this.userDetail = new UserDetailResource(user.getUserDetail());
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRoleResource getUserGroup() {
        return userGroup;
    }

    public void setUserGroup(UserRoleResource userRole) {
        this.userGroup = userRole;
    }

    public UserDetailResource getUserDetail() {
        return userDetail;
    }

    public void setUserDetail(UserDetailResource userDetail) {
        this.userDetail = userDetail;
    }
}

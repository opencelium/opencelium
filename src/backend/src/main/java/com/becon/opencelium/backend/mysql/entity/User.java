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

import com.becon.opencelium.backend.resource.user.UserResource;

import javax.persistence.*;
import javax.validation.constraints.Email;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Email
    @Column(name = "email")
    private String email;

    @Column(name = "password")
    private String password;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER, mappedBy = "user")
    private Activity activity;

    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, mappedBy = "user")
    private UserDetail userDetail;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", referencedColumnName = "id")
    private UserRole userRole;


    @OneToMany(mappedBy = "user", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<WidgetSetting> widgetSettings = new HashSet<>();

    public User() {
    }

//    public User(UserResource userResource) {
//        this.id = userResource.getUserId();
//        this.email = userResource.getEmail();
//        this.userDetail = new UserDetail(userResource.getUserDetail());
//        this.userRole = new UserRole(userResource.getUserGroup());
//        this.widgetSettings = userResource.getWidgetSettings()
//                                            .stream()
//                                            .map(WidgetSetting::new)
//                                            .collect(Collectors.toList());
//    }

    public User(UserResource userResource, Set<WidgetSetting> widgetSettings) {
        this.id = userResource.getUserId();
        this.email = userResource.getEmail();
        this.userDetail = new UserDetail(userResource.getUserDetail());
        this.userRole = new UserRole(userResource.getUserGroup());
        this.widgetSettings = widgetSettings;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Activity getActivity() {
        return activity;
    }

    public void setActivity(Activity activity) {
        this.activity = activity;
    }

    public UserDetail getUserDetail() {
        return userDetail;
    }

    public void setUserDetail(UserDetail userDetail) {
        this.userDetail = userDetail;
    }

    public UserRole getUserRole() {
        return userRole;
    }

    public void setUserRole(UserRole userRole) {
        this.userRole = userRole;
    }

    public Set<WidgetSetting> getWidgetSettings() {
        return widgetSettings;
    }

    public void setWidgetSettings(Set<WidgetSetting> widgetSettings) {
        this.widgetSettings = widgetSettings;
    }
}

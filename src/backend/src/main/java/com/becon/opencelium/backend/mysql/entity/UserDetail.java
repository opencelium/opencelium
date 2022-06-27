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

import com.becon.opencelium.backend.resource.user.UserDetailResource;
import com.becon.opencelium.backend.utility.StringUtility;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "detail")
public class UserDetail {

    @Id
    private int id;

    @MapsId
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "name")
    private String name;

    @Column(name = "surname")
    private String surname;

    @Column(name = "title")
    private String title;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "department")
    private String department;

    @Column(name = "organization")
    private String organization;

    @Column(name = "profile_picture")
    private String profilePicture;

    @Column(name = "tutorial")
    private Boolean tutorial;

    @Column(name = "theme")
    private String theme;

    @Column(name = "theme_sync")
    private boolean themeSync;

    @Column(name = "lang")
    private String lang;

    @Column(name = "repo_user")
    private String repoUser;

    @Column(name = "repo_password")
    private String repoPassword;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt;

    @UpdateTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    public UserDetail() {
    }

    public UserDetail(UserDetailResource userDetailResource) {
        this.name = userDetailResource.getName();
        this.surname = userDetailResource.getSurname();
        this.phoneNumber = userDetailResource.getPhoneNumber();
        this.organization = userDetailResource.getOrganization();
        this.department = userDetailResource.getDepartment();
        this.title = userDetailResource.getUserTitle();
        this.profilePicture = StringUtility.findImageFromUrl(userDetailResource.getProfilePicture());
        this.tutorial = userDetailResource.isAppTour();
        this.theme = userDetailResource.getTheme();
        this.themeSync = userDetailResource.isThemeSync();
        this.lang = userDetailResource.getLang();
        this.repoUser = userDetailResource.getBitbucketUser();
        this.repoPassword = userDetailResource.getBitbucketPassword();
    }


    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getOrganization() {
        return organization;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public Boolean getTutorial() {
        return tutorial;
    }

    public void setTutorial(Boolean tutorial) {
        this.tutorial = tutorial;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }

    public String getRepoUser() {
        return repoUser;
    }

//    public void setRepoUser(String repoUser) {
//        this.repoUser = repoUser;
//    }

//    public String getRepoPassword() {
//        return repoPassword;
//    }

    public void setRepoPassword(String repoPassword) {
        this.repoPassword = repoPassword;
    }

    public boolean isThemeSync() {
        return themeSync;
    }

    public void setThemeSync(boolean themeSync) {
        this.themeSync = themeSync;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}

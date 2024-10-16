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
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import jakarta.annotation.Resource;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.Date;

@Resource
public class UserDetailResource {

    private String name;
    private String surname;
    private String userTitle;
    private String phoneNumber;
    private String department;
    private String organization;
    private String profilePicture;
    private boolean appTour;
    private String theme;
    private boolean themeSync;
    private String lang;
    private String bitbucketUser;
    private String bitbucketPassword;
    //TODO: need to make it long type. Should be in unix timestamp like 1232341312313
    private Date requestTime;

    private final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
    private final String imagePath = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;
//    private final String imagePath = new ServerUtility().getUri();

    public UserDetailResource() {
    }

    public UserDetailResource(UserDetail userDetail) {
        this.name = userDetail.getName();
        this.surname = userDetail.getSurname();
        this.phoneNumber = userDetail.getPhoneNumber();
        this.department = userDetail.getDepartment();
        this.organization = userDetail.getOrganization();
        this.userTitle = userDetail.getTitle();
        this.appTour = userDetail.getTutorial();
        this.theme = userDetail.getTheme();
        this.lang = userDetail.getLang();
        this.themeSync = userDetail.isThemeSync();
        this.bitbucketUser = userDetail.getRepoUser();
//        this.bitbucketPassword = userDetail.get();
        if (userDetail.getProfilePicture() != null){
            this.profilePicture = imagePath + userDetail.getProfilePicture();
        }
        if (userDetail.getUser() != null && userDetail.getUser().getActivity() != null){
            this.requestTime = userDetail.getUser().getActivity().getRequestTime();
        }
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

    public String getUserTitle() {
        return userTitle;
    }

    public void setUserTitle(String userTitle) {
        this.userTitle = userTitle;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public boolean isAppTour() {
        return appTour;
    }

    public void setAppTour(boolean appTour) {
        this.appTour = appTour;
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

    public String getBitbucketUser() {
        return bitbucketUser;
    }

    public boolean isThemeSync() {
        return themeSync;
    }

    public void setThemeSync(boolean themeSync) {
        this.themeSync = themeSync;
    }

    public void setBitbucketUser(String bitbucketUser) {
        this.bitbucketUser = bitbucketUser;
    }

    public String getBitbucketPassword() {
        return bitbucketPassword;
    }

    public void setBitbucketPassword(String bitbucketPassword) {
        this.bitbucketPassword = bitbucketPassword;
    }

    public Date getRequestTime() {
        return requestTime;
    }

    public void setRequestTime(Date requestTime) {
        this.requestTime = requestTime;
    }
}

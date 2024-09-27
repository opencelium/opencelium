package com.becon.opencelium.backend.resource;

import jakarta.annotation.Resource;

@Resource
public class LdapConfigDTO {
    private String urls;
    private String username;
    private String password;
    private String baseDN;
    private String userDN;
    private String groupDN;
    private String userSearchFilter;
    private String groupSearchFilter;

    public String getUrls() {
        return urls;
    }

    public void setUrls(String urls) {
        this.urls = urls;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getBaseDN() {
        return baseDN;
    }

    public void setBaseDN(String baseDN) {
        this.baseDN = baseDN;
    }

    public String getUserDN() {
        return userDN;
    }

    public void setUserDN(String userDN) {
        this.userDN = userDN;
    }

    public String getGroupDN() {
        return groupDN;
    }

    public void setGroupDN(String groupDN) {
        this.groupDN = groupDN;
    }

    public String getUserSearchFilter() {
        return userSearchFilter;
    }

    public void setUserSearchFilter(String userSearchFilter) {
        this.userSearchFilter = userSearchFilter;
    }

    public String getGroupSearchFilter() {
        return groupSearchFilter;
    }

    public void setGroupSearchFilter(String groupSearchFilter) {
        this.groupSearchFilter = groupSearchFilter;
    }
}

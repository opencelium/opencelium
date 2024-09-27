package com.becon.opencelium.backend.resource;

import jakarta.annotation.Resource;

@Resource
public class LdapConfigDTO {
    private String url;
    private String baseDN;
    private String userDN;
    private String groupDN;
    private String readAccountDN;
    private String readAccountPassword;
    private String userSearchFilter;
    private String groupSearchFilter;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
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

    public String getReadAccountDN() {
        return readAccountDN;
    }

    public void setReadAccountDN(String readAccountDN) {
        this.readAccountDN = readAccountDN;
    }

    public String getReadAccountPassword() {
        return readAccountPassword;
    }

    public void setReadAccountPassword(String readAccountPassword) {
        this.readAccountPassword = readAccountPassword;
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

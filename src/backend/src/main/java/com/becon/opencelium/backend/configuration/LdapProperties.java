package com.becon.opencelium.backend.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "spring.security.ldap")
public class LdapProperties {
    private String url;
    private String username;
    private String password;
    private String base;
    private String userSearchBase;
    private String userSearchFilter = "(cn={0})";
    private String groupSearchBase;
    private String groupSearchFilter = "(member={0})";
    private List<Group2Role> groupRoleMapping = new ArrayList<>();
    private String defaultRole;
    private boolean showLogs = false;

    public String getConfiguration() {
        if (url == null && base == null && userSearchBase == null && groupSearchBase == null && username == null && password == null) {
            return "ldap configuration not found.";
        }

        return toString();
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
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

    public String getBase() {
        return base;
    }

    public void setBase(String base) {
        this.base = base;
    }

    public String getUserSearchBase() {
        return userSearchBase;
    }

    public void setUserSearchBase(String userSearchBase) {
        this.userSearchBase = userSearchBase;
    }

    public String getUserSearchFilter() {
        return userSearchFilter;
    }

    public void setUserSearchFilter(String userSearchFilter) {
        this.userSearchFilter = userSearchFilter;
    }

    public String getGroupSearchBase() {
        return groupSearchBase;
    }

    public void setGroupSearchBase(String groupSearchBase) {
        this.groupSearchBase = groupSearchBase;
    }

    public String getGroupSearchFilter() {
        return groupSearchFilter;
    }

    public void setGroupSearchFilter(String groupSearchFilter) {
        this.groupSearchFilter = groupSearchFilter;
    }

    public List<Group2Role> getGroupRoleMapping() {
        return groupRoleMapping;
    }

    public void setGroupRoleMapping(List<Group2Role> groupRoleMapping) {
        this.groupRoleMapping = groupRoleMapping;
    }

    public String getDefaultRole() {
        return defaultRole;
    }

    public void setDefaultRole(String defaultRole) {
        this.defaultRole = defaultRole;
    }

    public boolean isShowLogs() {
        return showLogs;
    }

    public void setShowLogs(boolean showLogs) {
        this.showLogs = showLogs;
    }

    @Override
    public String toString() {
        return "System found ldap configuration: {" +
                "urls='" + url + "', " +
                "base='" + base + "', " +
                "userSearchBase='" + userSearchBase + "', " +
                "groupSearchBase='" + groupSearchBase + "', " +
                "username='" + username + "', " +
                "groupSearchFilter='" + groupSearchFilter + "', " +
                "userSearchFilter='" + userSearchFilter + "'}";
    }

    public static class Group2Role {
        private String ldapGroup;
        private String ocRole;

        public String getLdapGroup() {
            return ldapGroup;
        }

        public void setLdapGroup(String ldapGroup) {
            this.ldapGroup = ldapGroup;
        }

        public String getOcRole() {
            return ocRole;
        }

        public void setOcRole(String ocRole) {
            this.ocRole = ocRole;
        }
    }
}

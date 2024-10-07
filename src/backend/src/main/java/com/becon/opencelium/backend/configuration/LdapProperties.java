package com.becon.opencelium.backend.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "spring.security.ldap")
public class LdapProperties {
    public static final String CONNECT_TIMEOUT_KEY = "com.sun.jndi.ldap.connect.timeout";
    public static final String READ_TIMEOUT_KEY = "com.sun.jndi.ldap.read.timeout";

    private String urls;
    private String username;
    private String password;
    private long timeout;
    private String userSearchBase;
    private String userSearchFilter = "(cn={0})";
    private String groupSearchBase;
    private String groupSearchFilter = "(member={0})";
    private List<Group2Role> groupRoleMapping = new ArrayList<>();
    private String defaultRole;
    private boolean showLogs = false;

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

    public long getTimeout() {
        return timeout;
    }

    public void setTimeout(long timeout) {
        this.timeout = timeout;
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

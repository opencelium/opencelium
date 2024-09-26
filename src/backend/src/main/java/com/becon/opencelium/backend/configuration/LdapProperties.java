package com.becon.opencelium.backend.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "spring.security.ldap")
public class LdapProperties {
    private String urls;
    private String base;
    private String userSearchBase;
    private String groupSearchBase;
    private String managerDn;
    private String managerPassword;
    private String groupSearchFilter = "(member={0})";
    private String userSearchFilter = "(cn={0})";
    private boolean showLogs = true;

    public String getConfiguration() {
        if (urls == null && base == null && userSearchBase == null && groupSearchBase == null && managerDn == null && managerPassword == null) {
            return "ldap configuration not found.";
        }

        return toString();
    }

    public String getUrls() {
        return urls;
    }

    public void setUrls(String urls) {
        this.urls = urls;
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

    public String getGroupSearchBase() {
        return groupSearchBase;
    }

    public void setGroupSearchBase(String groupSearchBase) {
        this.groupSearchBase = groupSearchBase;
    }

    public String getManagerDn() {
        return managerDn;
    }

    public void setManagerDn(String managerDn) {
        this.managerDn = managerDn;
    }

    public String getManagerPassword() {
        return managerPassword;
    }

    public void setManagerPassword(String managerPassword) {
        this.managerPassword = managerPassword;
    }

    public String getGroupSearchFilter() {
        return groupSearchFilter;
    }

    public void setGroupSearchFilter(String groupSearchFilter) {
        this.groupSearchFilter = groupSearchFilter;
    }

    public String getUserSearchFilter() {
        return userSearchFilter;
    }

    public void setUserSearchFilter(String userSearchFilter) {
        this.userSearchFilter = userSearchFilter;
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
                "urls='" + urls + "', " +
                "base='" + base + "', " +
                "userSearchBase='" + userSearchBase + "', " +
                "groupSearchBase='" + groupSearchBase + "', " +
                "managerDn='" + managerDn + "', " +
                "managerPassword='" + managerPassword + "', " +
                "groupSearchFilter='" + groupSearchFilter + "', " +
                "userSearchFilter='" + userSearchFilter + "'}";
    }
}

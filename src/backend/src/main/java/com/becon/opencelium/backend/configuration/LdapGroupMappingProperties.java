package com.becon.opencelium.backend.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "security.authorization.ldap")
public class LdapGroupMappingProperties {
    private List<GroupMapping> ldapGroupMapping;
    private String defaultMappingGroup;

    public static class GroupMapping {
        private String ldapGroup;
        private String group;

        public String getLdapGroup() {
            return ldapGroup;
        }

        public void setLdapGroup(String ldapGroup) {
            this.ldapGroup = ldapGroup;
        }

        public String getGroup() {
            return group;
        }

        public void setGroup(String group) {
            this.group = group;
        }
    }

    public List<GroupMapping> getLdapGroupMapping() {
        return ldapGroupMapping;
    }

    public void setLdapGroupMapping(List<GroupMapping> ldapGroupMapping) {
        this.ldapGroupMapping = ldapGroupMapping;
    }

    public String getDefaultMappingGroup() {
        return defaultMappingGroup;
    }

    public void setDefaultMappingGroup(String defaultMappingGroup) {
        this.defaultMappingGroup = defaultMappingGroup;
    }
}

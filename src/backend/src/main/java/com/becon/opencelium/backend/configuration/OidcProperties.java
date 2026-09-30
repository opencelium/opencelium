package com.becon.opencelium.backend.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@ConfigurationProperties(prefix = "spring.security.oidc")
public class OidcProperties {

    public static final String REGISTRATION_ID = "opencelium";

    private boolean enabled = false;
    private String displayName = "OpenID Connect";
    private String issuerUri;
    private String clientId;
    private String clientSecret;
    private List<String> scopes = new ArrayList<>(List.of("openid", "profile", "email"));
    private String redirectUri;
    private String frontendRedirectUri;
    private String authorizationUri;
    private String tokenUri;
    private String jwkSetUri;
    private String userInfoUri;
    private String emailClaim = "email";
    private String groupClaim = "groups";
    private String defaultRole;
    private boolean jitProvisioning = true;
    private List<Group2Role> groupRoleMapping = new ArrayList<>();
    private int timeout = 10000; // in milliseconds
    private int stateActivityTime = 300; // in seconds, lifetime of the authorization request
    private int ticketActivityTime = 60; // in seconds, one-time ticket lifetime
    @Value("${logging.level.org.springframework.security.oauth2:OFF}")
    private String showLogs;

    public String getRoleByGroup(String group) {
        return groupRoleMapping.stream()
                .filter(mapping -> Objects.equals(group, mapping.group))
                .map(Group2Role::getOcRole)
                .findFirst()
                .orElseThrow();
    }

    public List<String> getGroups() {
        return groupRoleMapping.stream()
                .map(Group2Role::getGroup)
                .toList();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getIssuerUri() {
        return issuerUri;
    }

    public void setIssuerUri(String issuerUri) {
        this.issuerUri = issuerUri;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public List<String> getScopes() {
        return scopes;
    }

    public void setScopes(List<String> scopes) {
        this.scopes = scopes;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public String getFrontendRedirectUri() {
        return frontendRedirectUri;
    }

    public void setFrontendRedirectUri(String frontendRedirectUri) {
        this.frontendRedirectUri = frontendRedirectUri;
    }

    public String getAuthorizationUri() {
        return authorizationUri;
    }

    public void setAuthorizationUri(String authorizationUri) {
        this.authorizationUri = authorizationUri;
    }

    public String getTokenUri() {
        return tokenUri;
    }

    public void setTokenUri(String tokenUri) {
        this.tokenUri = tokenUri;
    }

    public String getJwkSetUri() {
        return jwkSetUri;
    }

    public void setJwkSetUri(String jwkSetUri) {
        this.jwkSetUri = jwkSetUri;
    }

    public String getUserInfoUri() {
        return userInfoUri;
    }

    public void setUserInfoUri(String userInfoUri) {
        this.userInfoUri = userInfoUri;
    }

    public String getEmailClaim() {
        return emailClaim;
    }

    public void setEmailClaim(String emailClaim) {
        this.emailClaim = emailClaim;
    }

    public String getGroupClaim() {
        return groupClaim;
    }

    public void setGroupClaim(String groupClaim) {
        this.groupClaim = groupClaim;
    }

    public String getDefaultRole() {
        return defaultRole;
    }

    public void setDefaultRole(String defaultRole) {
        this.defaultRole = defaultRole;
    }

    public boolean isJitProvisioning() {
        return jitProvisioning;
    }

    public void setJitProvisioning(boolean jitProvisioning) {
        this.jitProvisioning = jitProvisioning;
    }

    public List<Group2Role> getGroupRoleMapping() {
        return groupRoleMapping;
    }

    public void setGroupRoleMapping(List<Group2Role> groupRoleMapping) {
        this.groupRoleMapping = groupRoleMapping;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public int getStateActivityTime() {
        return stateActivityTime;
    }

    public void setStateActivityTime(int stateActivityTime) {
        this.stateActivityTime = stateActivityTime;
    }

    public int getTicketActivityTime() {
        return ticketActivityTime;
    }

    public void setTicketActivityTime(int ticketActivityTime) {
        this.ticketActivityTime = ticketActivityTime;
    }

    public String isShowLogs() {
        return showLogs;
    }

    public void setShowLogs(String showLogs) {
        this.showLogs = showLogs;
    }

    public static class Group2Role {
        private String group;
        private String ocRole;

        public String getGroup() {
            return group;
        }

        public void setGroup(String group) {
            this.group = group;
        }

        public String getOcRole() {
            return ocRole;
        }

        public void setOcRole(String ocRole) {
            this.ocRole = ocRole;
        }
    }
}
